import { NextResponse } from "next/server";
import {
    listElevenLabsConversations,
    getElevenLabsConversation,
    sendElevenLabsFeedback,
    listElevenLabsAgents,
    PicaElevenLabsConfig,
} from "@/lib/elevenlabs/pica-client";

function getConfig(request: Request): PicaElevenLabsConfig {
    const url = new URL(request.url);
    
    // For audio requests, also check query param since browser audio player can't send headers
    const apiKeyFromQuery = url.searchParams.get('apiKey');
    
    return {
        secretKey: request.headers.get('x-pica-secret') || process.env.PICA_SECRET_KEY || '',
        connectionKey: request.headers.get('x-pica-connection-key') || process.env.PICA_ELEVENLABS_CONNECTION_KEY || '',
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
                
                // The ElevenLabs audio endpoint returns binary audio data
                // We'll proxy it through our API
                const apiKey = config.elevenLabsApiKey;
                if (!apiKey) {
                    return NextResponse.json({ error: 'ElevenLabs API key required for audio' }, { status: 400 });
                }
                
                // Retry logic for audio fetch
                let lastError: Error | null = null;
                for (let attempt = 0; attempt < 3; attempt++) {
                    try {
                        const audioResponse = await fetch(
                            `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`,
                            {
                                headers: {
                                    'xi-api-key': apiKey,
                                },
                            }
                        );
                        
                        if (!audioResponse.ok) {
                            const errorText = await audioResponse.text();
                            // If 404, audio doesn't exist - don't retry
                            if (audioResponse.status === 404) {
                                return NextResponse.json(
                                    { error: 'Audio recording not available for this conversation' }, 
                                    { status: 404 }
                                );
                            }
                            throw new Error(`Audio fetch failed: ${audioResponse.status} - ${errorText}`);
                        }
                        
                        // Get content type from response or default to audio/mpeg
                        const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
                        const contentLength = audioResponse.headers.get('content-length');
                        
                        // Return the audio as a stream with proper headers for browser playback
                        const audioBuffer = await audioResponse.arrayBuffer();
                        
                        const headers: Record<string, string> = {
                            'Content-Type': contentType,
                            'Accept-Ranges': 'bytes',
                            'Cache-Control': 'public, max-age=3600',
                            'Access-Control-Allow-Origin': '*',
                        };
                        
                        if (contentLength) {
                            headers['Content-Length'] = contentLength;
                        }
                        
                        return new NextResponse(audioBuffer, { headers });
                    } catch (error) {
                        lastError = error instanceof Error ? error : new Error('Unknown error');
                        // Wait before retry (exponential backoff)
                        if (attempt < 2) {
                            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        }
                    }
                }
                
                // All retries failed
                return NextResponse.json(
                    { error: lastError?.message || 'Failed to fetch audio after multiple attempts' }, 
                    { status: 500 }
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
