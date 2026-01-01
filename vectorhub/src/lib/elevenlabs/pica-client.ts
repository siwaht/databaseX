/**
 * ElevenLabs Conversation API via Pica Passthrough
 */

const PICA_BASE_URL = 'https://api.picaos.com/v1/passthrough';

// Action IDs for ElevenLabs endpoints
export const ELEVENLABS_ACTION_IDS = {
    LIST_CONVERSATIONS: 'conn_mod_def::GCcb-oM9Wxk::S5TI7_cuQAS6oIbDcX6SXg',
    GET_CONVERSATION: 'conn_mod_def::GCcb-2-J_rw::qjRyRZbVRUeySosJocrT-w',
    GET_CONVERSATION_AUDIO: 'conn_mod_def::GCcb-cGKkqU::GhWURfavRkuy6xKx6kam6Q',
    GET_HISTORY_AUDIO: 'conn_mod_def::GCcb_D1JpKo::vTBWfEThToW_azZ-ueTC3w',
    SEND_FEEDBACK: 'conn_mod_def::GCcb-pY0rV4::UkvnvUzLSmSdLDGcabyMAA',
};

export interface ElevenLabsConversation {
    agent_id: string;
    conversation_id: string;
    start_time_unix_secs: number;
    call_duration_secs: number;
    message_count: number;
    status: 'processing' | 'done';
    call_successful: 'success' | 'failure' | 'unknown';
    agent_name: string;
}

export interface ElevenLabsTranscriptItem {
    role: 'user' | 'agent';
    time_in_call_secs: number;
    message: string;
}

export interface ElevenLabsConversationDetail {
    agent_id: string;
    conversation_id: string;
    status: 'processing' | 'done';
    transcript: ElevenLabsTranscriptItem[];
    metadata: {
        start_time_unix_secs: number;
        call_duration_secs: number;
    };
    feedback?: {
        score: 'like' | 'dislike';
    };
    analysis: {
        call_successful: 'success' | 'failure' | 'unknown';
        transcript_summary: string;
    };
}

export interface PicaElevenLabsConfig {
    secretKey: string;
    connectionKey: string;
}

async function fetchElevenLabsData<T>(
    endpoint: string,
    actionId: string,
    config: PicaElevenLabsConfig,
    options: { method?: string; body?: unknown; query?: Record<string, string | number>; pathParams?: Record<string, string> } = {}
): Promise<T> {
    // Replace path parameters in the endpoint URL
    let finalEndpoint = endpoint;
    if (options.pathParams) {
        Object.entries(options.pathParams).forEach(([key, value]) => {
            finalEndpoint = finalEndpoint.replace(`{{${key}}}`, value);
        });
    }
    
    const url = new URL(`${PICA_BASE_URL}${finalEndpoint}`);
    if (options.query) {
        Object.entries(options.query).forEach(([key, value]) => 
            url.searchParams.append(key, String(value))
        );
    }

    const resp = await fetch(url.toString(), {
        method: options.method || 'GET',
        headers: {
            'x-pica-secret': config.secretKey,
            'x-pica-connection-key': config.connectionKey,
            'x-pica-action-id': actionId,
            'Content-Type': 'application/json',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Pica API error: ${resp.status} - ${errorText}`);
    }

    return resp.json();
}

// List all ElevenLabs conversations
export async function listElevenLabsConversations(
    config: PicaElevenLabsConfig,
    options: {
        cursor?: string;
        agent_id?: string;
        call_successful?: 'success' | 'failure' | 'unknown';
        page_size?: number;
    } = {}
): Promise<{ conversations: ElevenLabsConversation[]; has_more: boolean; next_cursor?: string }> {
    const query: Record<string, string | number> = {};
    if (options.cursor) query.cursor = options.cursor;
    if (options.agent_id) query.agent_id = options.agent_id;
    if (options.call_successful) query.call_successful = options.call_successful;
    if (options.page_size) query.page_size = options.page_size;

    return fetchElevenLabsData(
        '/v1/convai/conversations',
        ELEVENLABS_ACTION_IDS.LIST_CONVERSATIONS,
        config,
        { query }
    );
}

// Get conversation details with transcript and summary
export async function getElevenLabsConversation(
    config: PicaElevenLabsConfig,
    conversationId: string
): Promise<ElevenLabsConversationDetail> {
    return fetchElevenLabsData(
        '/v1/convai/conversations/{{conversation_id}}',
        ELEVENLABS_ACTION_IDS.GET_CONVERSATION,
        config,
        { pathParams: { conversation_id: conversationId } }
    );
}

// Get conversation audio
export async function getElevenLabsConversationAudio(
    config: PicaElevenLabsConfig,
    conversationId: string
): Promise<unknown> {
    return fetchElevenLabsData(
        '/v1/convai/conversations/{{conversation_id}}/audio',
        ELEVENLABS_ACTION_IDS.GET_CONVERSATION_AUDIO,
        config,
        { pathParams: { conversation_id: conversationId } }
    );
}

// Get audio from history item
export async function getElevenLabsHistoryAudio(
    config: PicaElevenLabsConfig,
    historyItemId: string
): Promise<{ abc: string | null }> {
    return fetchElevenLabsData(
        '/history/{{history_item_id}}/audio',
        ELEVENLABS_ACTION_IDS.GET_HISTORY_AUDIO,
        config,
        { pathParams: { history_item_id: historyItemId } }
    );
}

// Send feedback on a conversation
export async function sendElevenLabsFeedback(
    config: PicaElevenLabsConfig,
    conversationId: string,
    feedback: 'like' | 'dislike'
): Promise<Record<string, never>> {
    return fetchElevenLabsData(
        '/v1/convai/conversations/{{conversation_id}}/feedback',
        ELEVENLABS_ACTION_IDS.SEND_FEEDBACK,
        config,
        { method: 'POST', body: { feedback }, pathParams: { conversation_id: conversationId } }
    );
}
