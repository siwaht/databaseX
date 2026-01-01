import { NextResponse } from "next/server";
import {
    listElevenLabsConversations,
    getElevenLabsConversation,
    getElevenLabsConversationAudio,
    sendElevenLabsFeedback,
    PicaElevenLabsConfig,
} from "@/lib/elevenlabs/pica-client";

function getConfig(request: Request): PicaElevenLabsConfig {
    return {
        secretKey: request.headers.get('x-pica-secret') || process.env.PICA_SECRET_KEY || '',
        connectionKey: request.headers.get('x-pica-connection-key') || process.env.PICA_ELEVENLABS_CONNECTION_KEY || '',
        elevenLabsApiKey: request.headers.get('x-elevenlabs-api-key') || process.env.ELEVENLABS_API_KEY || '',
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
                const data = await getElevenLabsConversationAudio(config, conversationId);
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
