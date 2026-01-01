import { NextResponse } from "next/server";
import {
    listConversations,
    fetchConversation,
    listChannelMessages,
    listRecordingTranscriptions,
    fetchTranscription,
    PicaConfig,
} from "@/lib/twilio/pica-client";

// Get Pica config from environment or request
function getPicaConfig(secretKey?: string, connectionKey?: string): PicaConfig {
    return {
        secretKey: secretKey || process.env.PICA_SECRET_KEY || '',
        connectionKey: connectionKey || process.env.PICA_TWILIO_CONNECTION_KEY || '',
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Allow passing keys via headers for flexibility
    const secretKey = request.headers.get('x-pica-secret') || undefined;
    const connectionKey = request.headers.get('x-pica-connection-key') || undefined;
    const config = getPicaConfig(secretKey, connectionKey);

    if (!config.secretKey || !config.connectionKey) {
        return NextResponse.json(
            { error: 'Pica credentials not configured. Set PICA_SECRET_KEY and PICA_TWILIO_CONNECTION_KEY.' },
            { status: 400 }
        );
    }

    try {
        switch (action) {
            case 'conversations': {
                const pageSize = parseInt(searchParams.get('pageSize') || '50');
                const data = await listConversations(config, pageSize);
                return NextResponse.json(data);
            }

            case 'conversation': {
                const sid = searchParams.get('sid');
                if (!sid) {
                    return NextResponse.json({ error: 'Conversation SID required' }, { status: 400 });
                }
                const data = await fetchConversation(config, sid);
                return NextResponse.json(data);
            }

            case 'messages': {
                const serviceSid = searchParams.get('serviceSid');
                const channelSid = searchParams.get('channelSid');
                if (!serviceSid || !channelSid) {
                    return NextResponse.json(
                        { error: 'serviceSid and channelSid required' },
                        { status: 400 }
                    );
                }
                const order = searchParams.get('order') as 'asc' | 'desc' | null;
                const pageSize = parseInt(searchParams.get('pageSize') || '50');
                const data = await listChannelMessages(config, serviceSid, channelSid, {
                    order: order || undefined,
                    pageSize,
                });
                return NextResponse.json(data);
            }

            case 'transcriptions': {
                const accountSid = searchParams.get('accountSid');
                const recordingSid = searchParams.get('recordingSid');
                if (!accountSid || !recordingSid) {
                    return NextResponse.json(
                        { error: 'accountSid and recordingSid required' },
                        { status: 400 }
                    );
                }
                const pageSize = parseInt(searchParams.get('pageSize') || '50');
                const data = await listRecordingTranscriptions(config, accountSid, recordingSid, pageSize);
                return NextResponse.json(data);
            }

            case 'transcription': {
                const accountSid = searchParams.get('accountSid');
                const transcriptionSid = searchParams.get('sid');
                if (!accountSid || !transcriptionSid) {
                    return NextResponse.json(
                        { error: 'accountSid and transcription sid required' },
                        { status: 400 }
                    );
                }
                const data = await fetchTranscription(config, accountSid, transcriptionSid);
                return NextResponse.json(data);
            }

            default:
                return NextResponse.json({
                    message: 'Twilio API via Pica Passthrough',
                    availableActions: [
                        'conversations - List all conversations',
                        'conversation - Get specific conversation (requires sid)',
                        'messages - List channel messages (requires serviceSid, channelSid)',
                        'transcriptions - List recording transcriptions (requires accountSid, recordingSid)',
                        'transcription - Get specific transcription (requires accountSid, sid)',
                    ],
                });
        }
    } catch (error) {
        console.error('Twilio API error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch Twilio data' },
            { status: 500 }
        );
    }
}

// POST for testing connection
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { secretKey, connectionKey } = body;

        if (!secretKey || !connectionKey) {
            return NextResponse.json(
                { error: 'secretKey and connectionKey required' },
                { status: 400 }
            );
        }

        const config: PicaConfig = { secretKey, connectionKey };
        
        // Test connection by listing conversations
        const data = await listConversations(config, 1);
        
        return NextResponse.json({
            success: true,
            message: 'Connection successful',
            conversationCount: data.conversations?.length || 0,
        });
    } catch (error) {
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Connection failed' 
            },
            { status: 400 }
        );
    }
}
