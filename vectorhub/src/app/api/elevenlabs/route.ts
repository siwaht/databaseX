import { NextResponse } from "next/server";
import {
    listElevenLabsConversations,
    getElevenLabsConversation,
    getElevenLabsConversationAudio,
    sendElevenLabsFeedback,
    listElevenLabsAgents,
    PicaElevenLabsConfig,
} from "@/lib/elevenlabs/pica-client";

export const runtime = 'edge';

function getConfig(request: Request): PicaElevenLabsConfig {
    const url = new URL(request.url);

    // For audio requests, also check query param since browser audio player can't send headers
    const apiKeyFromQuery = url.searchParams.get('apiKey');
    const secretKeyFromQuery = url.searchParams.get('secretKey');
    const connectionKeyFromQuery = url.searchParams.get('connectionKey');

    return {
        secretKey: secretKeyFromQuery || request.headers.get('x-pica-secret') || process.env.PICA_SECRET_KEY || '',
        connectionKey: connectionKeyFromQuery || request.headers.get('x-pica-connection-key') || process.env.PICA_ELEVENLABS_CONNECTION_KEY || '',
        elevenLabsApiKey: apiKeyFromQuery || request.headers.get('x-elevenlabs-api-key') || process.env.ELEVENLABS_API_KEY || '',
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const config = getConfig(request);

    // Check if we have either Pica or direct ElevenLabs credentials
    const hasPica = config.secretKey && config.connectionKey;
    const hasDirect = !!config.elevenLabsApiKey;

    if (!hasPica && !hasDirect) {
        return NextResponse.json(
            { error: 'Credentials not configured. Provide either Pica keys or ElevenLabs API key.' },
            { status: 400 }
        );
    }

    try {
        switch (action) {
            case 'conversations': {
                const pageSize = parseInt(searchParams.get('page_size') || '30');
                const agentId = searchParams.get('agent_id') || undefined;
                const callSuccessful = searchParams.get('call_successful') as 'success' | 'failure' | 'unknown' | null;
                const cursor = searchParams.get('cursor') || undefined;

                const data = await listElevenLabsConversations(config, {
                    page_size: pageSize,
                    agent_id: agentId,
                    call_successful: callSuccessful || undefined,
                    cursor,
                });
                return NextResponse.json(data);
            }

            case 'conversation': {
                const conversationId = searchParams.get('id');
                if (!conversationId) {
                    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
                }
                const data = await getElevenLabsConversation(config, conversationId);
                return NextResponse.json(data);
            }

            case 'audio': {
                const conversationId = searchParams.get('id');
                if (!conversationId) {
                    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
                }

                // Try direct ElevenLabs API first
                if (config.elevenLabsApiKey) {
                    try {
                        const audioResponse = await fetch(
                            `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
                            {
                                headers: {
                                    'xi-api-key': config.elevenLabsApiKey,
                                },
                            }
                        );

                        if (audioResponse.ok) {
                            const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
                            const audioBuffer = await audioResponse.arrayBuffer();

                            if (audioBuffer.byteLength > 0) {
                                return new NextResponse(audioBuffer, {
                                    headers: {
                                        'Content-Type': contentType,
                                        'Content-Length': audioBuffer.byteLength.toString(),
                                        'Cache-Control': 'public, max-age=3600',
                                    },
                                });
                            }
                        }
                    } catch (e) {
                        console.log('[Audio] Direct API failed:', e);
                    }
                }

                // Fallback to Pica passthrough
                if (config.secretKey && config.connectionKey) {
                    try {
                        const audioResult = await getElevenLabsConversationAudio(config, conversationId);

                        if (audioResult.audio_data && audioResult.audio_data.byteLength > 0) {
                            return new NextResponse(audioResult.audio_data, {
                                headers: {
                                    'Content-Type': audioResult.content_type || 'audio/mpeg',
                                    'Content-Length': audioResult.audio_data.byteLength.toString(),
                                    'Cache-Control': 'public, max-age=3600',
                                },
                            });
                        }

                        if (audioResult.audio_url) {
                            const audioResponse = await fetch(audioResult.audio_url);
                            if (audioResponse.ok) {
                                const audioBuffer = await audioResponse.arrayBuffer();
                                const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';

                                return new NextResponse(audioBuffer, {
                                    headers: {
                                        'Content-Type': contentType,
                                        'Content-Length': audioBuffer.byteLength.toString(),
                                        'Cache-Control': 'public, max-age=3600',
                                    },
                                });
                            }
                        }
                    } catch (e) {
                        console.log('[Audio] Pica passthrough failed:', e);
                    }
                }

                return NextResponse.json(
                    { error: 'Audio not available for this conversation' },
                    { status: 404 }
                );
            }

            case 'audio-url': {
                // Return the audio URL - we'll let the audio player handle errors
                const conversationId = searchParams.get('id');
                if (!conversationId) {
                    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
                }

                const apiKey = config.elevenLabsApiKey;
                if (!apiKey) {
                    return NextResponse.json({ has_audio: false, error: 'API key required' });
                }

                // Instead of HEAD request (which ElevenLabs may not support), 
                // try a GET request with Range header to check if audio exists
                try {
                    const checkResponse = await fetch(
                        `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
                        {
                            method: 'GET',
                            headers: {
                                'xi-api-key': apiKey,
                                'Range': 'bytes=0-0', // Request just first byte to check availability
                            },
                        }
                    );

                    // 200 or 206 (partial content) means audio exists
                    const hasAudio = checkResponse.ok || checkResponse.status === 206;

                    return NextResponse.json({
                        has_audio: hasAudio,
                        audio_url: hasAudio ? `/api/elevenlabs?action=audio&id=${conversationId}` : null,
                    });
                } catch {
                    // If check fails, still return the URL and let the player handle errors
                    return NextResponse.json({
                        has_audio: true,
                        audio_url: `/api/elevenlabs?action=audio&id=${conversationId}`,
                    });
                }
            }

            case 'agents': {
                const data = await listElevenLabsAgents(config);
                return NextResponse.json(data);
            }

            case 'debug-audio': {
                // Debug endpoint to see raw audio response
                const conversationId = searchParams.get('id');
                if (!conversationId) {
                    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
                }

                const apiKey = config.elevenLabsApiKey;
                const results: Record<string, unknown> = {
                    conversationId,
                    hasApiKey: !!apiKey,
                    hasPicaKeys: !!(config.secretKey && config.connectionKey),
                };

                // Try direct API
                if (apiKey) {
                    try {
                        const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`;
                        const resp = await fetch(url, {
                            headers: { 'xi-api-key': apiKey },
                        });

                        results.directApi = {
                            status: resp.status,
                            statusText: resp.statusText,
                            contentType: resp.headers.get('content-type'),
                            contentLength: resp.headers.get('content-length'),
                        };

                        if (resp.ok) {
                            const contentType = resp.headers.get('content-type') || '';
                            if (contentType.includes('application/json')) {
                                results.directApiBody = await resp.json();
                            } else {
                                const buffer = await resp.arrayBuffer();
                                results.directApiBody = {
                                    type: 'binary',
                                    size: buffer.byteLength,
                                    first20Bytes: Array.from(new Uint8Array(buffer.slice(0, 20))),
                                };
                            }
                        } else {
                            results.directApiBody = await resp.text();
                        }
                    } catch (error) {
                        results.directApiError = error instanceof Error ? error.message : 'Unknown error';
                    }
                }

                // Try Pica
                if (config.secretKey && config.connectionKey) {
                    try {
                        const url = `https://api.picaos.com/v1/passthrough/v1/convai/conversations/${conversationId}/audio`;
                        const resp = await fetch(url, {
                            headers: {
                                'x-pica-secret': config.secretKey,
                                'x-pica-connection-key': config.connectionKey,
                                'x-pica-action-id': 'conn_mod_def::GCcb-cGKkqU::GhWURfavRkuy6xKx6kam6Q',
                            },
                        });

                        results.picaApi = {
                            status: resp.status,
                            statusText: resp.statusText,
                            contentType: resp.headers.get('content-type'),
                        };

                        if (resp.ok) {
                            const contentType = resp.headers.get('content-type') || '';
                            if (contentType.includes('application/json')) {
                                results.picaApiBody = await resp.json();
                            } else {
                                const buffer = await resp.arrayBuffer();
                                results.picaApiBody = { type: 'binary', size: buffer.byteLength };
                            }
                        } else {
                            results.picaApiBody = await resp.text();
                        }
                    } catch (error) {
                        results.picaApiError = error instanceof Error ? error.message : 'Unknown error';
                    }
                }

                // Also get conversation details to check has_audio
                try {
                    const convDetail = await getElevenLabsConversation(config, conversationId);
                    results.conversationDetail = {
                        has_audio: convDetail.has_audio,
                        has_user_audio: convDetail.has_user_audio,
                        has_response_audio: convDetail.has_response_audio,
                        status: convDetail.status,
                    };
                } catch (error) {
                    results.conversationDetailError = error instanceof Error ? error.message : 'Unknown error';
                }

                return NextResponse.json(results);
            }

            default:
                return NextResponse.json({
                    message: 'ElevenLabs Conversation API',
                    availableActions: [
                        'conversations - List all conversations',
                        'conversation - Get conversation details with transcript (requires id)',
                        'audio - Get conversation audio (requires id)',
                    ],
                    note: 'Supports both Pica passthrough and direct ElevenLabs API',
                });
        }
    } catch (error) {
        console.error('ElevenLabs API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch ElevenLabs data' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, secretKey, connectionKey, elevenLabsApiKey, conversationId, feedback } = body;

        const config: PicaElevenLabsConfig = {
            secretKey: secretKey || '',
            connectionKey: connectionKey || '',
            elevenLabsApiKey: elevenLabsApiKey || '',
        };

        const hasPica = config.secretKey && config.connectionKey;
        const hasDirect = !!config.elevenLabsApiKey;

        if (!hasPica && !hasDirect) {
            return NextResponse.json(
                { error: 'Provide either Pica keys or ElevenLabs API key' },
                { status: 400 }
            );
        }

        if (action === 'test') {
            // Test connection by listing conversations
            const data = await listElevenLabsConversations(config, { page_size: 1 });
            return NextResponse.json({
                success: true,
                message: 'Connection successful',
                conversationCount: data.conversations?.length || 0,
                method: hasDirect ? 'direct' : 'pica',
            });
        }

        if (action === 'feedback') {
            if (!conversationId || !feedback) {
                return NextResponse.json(
                    { error: 'conversationId and feedback required' },
                    { status: 400 }
                );
            }
            await sendElevenLabsFeedback(config, conversationId, feedback);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Request failed' },
            { status: 400 }
        );
    }
}
