import { NextResponse } from "next/server";
import {
    listElevenLabsConversations,
    getElevenLabsConversation,
    getElevenLabsConversationAudio,
    sendElevenLabsFeedback,
    PicaElevenLabsConfig,
} from "@/lib/elevenlabs/pica-client";

function getConfig(secretKey?: string, connectionKey?: string): PicaElevenLabsConfig {
    return {
        secretKey: secretKey || process.env.PICA_SECRET_KEY || '',
        connectionKey: connectionKey || process.env.PICA_ELEVENLABS_CONNECTION_KEY || '',
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const secretKey = request.headers.get('x-pica-secret') || undefined;
    const connectionKey = request.headers.get('x-pica-connection-key') || undefined;
    const config = getConfig(secretKey, connectionKey);

    if (!config.secretKey || !config.connectionKey) {
        return NextResponse.json(
            { error: 'Pica credentials not configured. Set PICA_SECRET_KEY and PICA_ELEVENLABS_CONNECTION_KEY.' },
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
                    message: 'ElevenLabs Conversation API via Pica Passthrough',
                    availableActions: [
                        'conversations - List all conversations',
                        'conversation - Get conversation details with transcript (requires id)',
                        'audio - Get conversation audio (requires id)',
                    ],
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
        const { action, secretKey, connectionKey, conversationId, feedback } = body;

        const config = getConfig(secretKey, connectionKey);

        if (!config.secretKey || !config.connectionKey) {
            return NextResponse.json(
                { error: 'secretKey and connectionKey required' },
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
