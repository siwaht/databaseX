/**
 * ElevenLabs Conversation API - Direct API + Pica Passthrough support
 */

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io';
const PICA_BASE_URL = 'https://api.picaos.com/v1/passthrough';

// Action IDs for ElevenLabs endpoints via Pica
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
    agent_name?: string;
    transcript_summary?: string;
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
        cost?: number;
        phone_call_details?: {
            from_number?: string;
            to_number?: string;
            call_sid?: string;
        };
        termination_reason?: string;
        recording_url?: string; // Some conversations may have direct recording URL
    };
    has_audio?: boolean;
    has_user_audio?: boolean;
    has_response_audio?: boolean;
    recording_url?: string; // Direct recording URL if available
    audio_url?: string; // Alternative audio URL field
    feedback?: {
        score: 'like' | 'dislike';
    };
    analysis?: {
        call_successful: 'success' | 'failure' | 'unknown';
        transcript_summary?: string;
        data_collection_results?: Record<string, unknown>;
    };
    conversation_initiation_client_data?: {
        dynamic_variables?: Record<string, string>;
    };
}

export interface ElevenLabsAgent {
    agent_id: string;
    name: string;
    created_at_unix_secs?: number;
    conversation_config?: {
        agent?: {
            prompt?: {
                prompt?: string;
            };
            first_message?: string;
            language?: string;
        };
    };
}

export interface PicaElevenLabsConfig {
    secretKey: string;
    connectionKey: string;
    // Optional: direct ElevenLabs API key (bypasses Pica)
    elevenLabsApiKey?: string;
}

// Direct ElevenLabs API call
async function fetchElevenLabsDirect<T>(
    endpoint: string,
    apiKey: string,
    options: { method?: string; body?: unknown; query?: Record<string, string | number> } = {}
): Promise<T> {
    const url = new URL(`${ELEVENLABS_API_URL}${endpoint}`);
    if (options.query) {
        Object.entries(options.query).forEach(([key, value]) => 
            url.searchParams.append(key, String(value))
        );
    }

    const resp = await fetch(url.toString(), {
        method: options.method || 'GET',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`ElevenLabs API error: ${resp.status} - ${errorText}`);
    }

    return resp.json();
}

// Pica Passthrough API call for binary data (like audio)
async function fetchElevenLabsPicaBinary(
    endpoint: string,
    actionId: string,
    config: PicaElevenLabsConfig
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
    const url = new URL(`${PICA_BASE_URL}${endpoint}`);

    const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'x-pica-secret': config.secretKey,
            'x-pica-connection-key': config.connectionKey,
            'x-pica-action-id': actionId,
        },
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Pica API error: ${resp.status} - ${errorText}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    
    // If JSON, return null (caller should handle JSON response separately)
    if (contentType.includes('application/json')) {
        return null;
    }
    
    const data = await resp.arrayBuffer();
    return { data, contentType };
}

// Pica Passthrough API call
async function fetchElevenLabsPica<T>(
    endpoint: string,
    actionId: string,
    config: PicaElevenLabsConfig,
    options: { method?: string; body?: unknown; query?: Record<string, string | number> } = {}
): Promise<T> {
    const url = new URL(`${PICA_BASE_URL}${endpoint}`);
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

    // Use direct API if key provided, otherwise Pica
    if (config.elevenLabsApiKey) {
        return fetchElevenLabsDirect(
            '/v1/convai/conversations',
            config.elevenLabsApiKey,
            { query }
        );
    }

    return fetchElevenLabsPica(
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
    // Always use direct API for conversation details (Pica has issues with path params)
    if (config.elevenLabsApiKey) {
        return fetchElevenLabsDirect(
            `/v1/convai/conversations/${conversationId}`,
            config.elevenLabsApiKey
        );
    }
    
    // Fallback to Pica (may not work due to path param issues)
    return fetchElevenLabsPica(
        `/v1/convai/conversations/${conversationId}`,
        ELEVENLABS_ACTION_IDS.GET_CONVERSATION,
        config
    );
}

// Get conversation audio - returns audio URL or fetches binary audio
export async function getElevenLabsConversationAudio(
    config: PicaElevenLabsConfig,
    conversationId: string
): Promise<{ audio_url?: string; audio_data?: ArrayBuffer; content_type?: string }> {
    // Try direct API first if key provided
    if (config.elevenLabsApiKey) {
        const url = `${ELEVENLABS_API_URL}/v1/convai/conversations/${conversationId}/audio`;
        console.log('[ElevenLabs] Fetching audio from:', url);
        
        const resp = await fetch(url, {
            headers: {
                'xi-api-key': config.elevenLabsApiKey,
            },
        });

        console.log('[ElevenLabs] Audio response status:', resp.status);
        console.log('[ElevenLabs] Audio response content-type:', resp.headers.get('content-type'));

        if (!resp.ok) {
            const errorText = await resp.text();
            console.error('[ElevenLabs] Audio error response:', errorText);
            throw new Error(`ElevenLabs API error: ${resp.status} - ${errorText}`);
        }

        const contentType = resp.headers.get('content-type') || '';
        
        // Check if JSON response (contains audio_url) or binary audio
        if (contentType.includes('application/json')) {
            const jsonData = await resp.json();
            console.log('[ElevenLabs] Audio JSON response:', JSON.stringify(jsonData));
            return jsonData;
        } else {
            // Binary audio data
            const audioData = await resp.arrayBuffer();
            console.log('[ElevenLabs] Audio binary data size:', audioData.byteLength);
            return {
                audio_data: audioData,
                content_type: contentType || 'audio/mpeg',
            };
        }
    }
    
    // Try Pica passthrough
    if (config.secretKey && config.connectionKey) {
        console.log('[Pica] Fetching audio via passthrough');
        
        // First try to get binary audio directly
        try {
            const binaryResult = await fetchElevenLabsPicaBinary(
                `/v1/convai/conversations/${conversationId}/audio`,
                ELEVENLABS_ACTION_IDS.GET_CONVERSATION_AUDIO,
                config
            );
            
            if (binaryResult && binaryResult.data.byteLength > 0) {
                console.log('[Pica] Got binary audio:', binaryResult.data.byteLength, 'bytes');
                return {
                    audio_data: binaryResult.data,
                    content_type: binaryResult.contentType || 'audio/mpeg',
                };
            }
        } catch (error) {
            console.log('[Pica] Binary fetch failed, trying JSON:', error);
        }
        
        // Fallback to JSON response (might contain audio_url)
        try {
            const result = await fetchElevenLabsPica<{ audio_url?: string }>(
                `/v1/convai/conversations/${conversationId}/audio`,
                ELEVENLABS_ACTION_IDS.GET_CONVERSATION_AUDIO,
                config
            );
            console.log('[Pica] Audio JSON response:', JSON.stringify(result));
            return result;
        } catch (error) {
            console.error('[Pica] Audio fetch error:', error);
            throw error;
        }
    }
    
    throw new Error('No valid credentials for audio fetch');
}

// Get history item audio (alternative audio endpoint)
export async function getElevenLabsHistoryAudio(
    config: PicaElevenLabsConfig,
    historyItemId: string
): Promise<{ audio_url?: string; audio_data?: ArrayBuffer; content_type?: string }> {
    if (config.elevenLabsApiKey) {
        const url = `${ELEVENLABS_API_URL}/v1/history/${historyItemId}/audio`;
        console.log('[ElevenLabs] Fetching history audio from:', url);
        
        const resp = await fetch(url, {
            headers: {
                'xi-api-key': config.elevenLabsApiKey,
            },
        });

        if (!resp.ok) {
            const errorText = await resp.text();
            throw new Error(`ElevenLabs API error: ${resp.status} - ${errorText}`);
        }

        const contentType = resp.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            return resp.json();
        } else {
            const audioData = await resp.arrayBuffer();
            return {
                audio_data: audioData,
                content_type: contentType || 'audio/mpeg',
            };
        }
    }
    
    // Pica passthrough for history audio
    return fetchElevenLabsPica(
        `/v1/history/${historyItemId}/audio`,
        ELEVENLABS_ACTION_IDS.GET_HISTORY_AUDIO,
        config
    );
}

// Send feedback on a conversation
export async function sendElevenLabsFeedback(
    config: PicaElevenLabsConfig,
    conversationId: string,
    feedback: 'like' | 'dislike'
): Promise<Record<string, never>> {
    if (config.elevenLabsApiKey) {
        return fetchElevenLabsDirect(
            `/v1/convai/conversations/${conversationId}/feedback`,
            config.elevenLabsApiKey,
            { method: 'POST', body: { feedback } }
        );
    }
    
    return fetchElevenLabsPica(
        `/v1/convai/conversations/${conversationId}/feedback`,
        ELEVENLABS_ACTION_IDS.SEND_FEEDBACK,
        config,
        { method: 'POST', body: { feedback } }
    );
}

// List all ElevenLabs agents
export async function listElevenLabsAgents(
    config: PicaElevenLabsConfig
): Promise<{ agents: ElevenLabsAgent[] }> {
    if (config.elevenLabsApiKey) {
        return fetchElevenLabsDirect(
            '/v1/convai/agents',
            config.elevenLabsApiKey
        );
    }
    
    throw new Error('Direct ElevenLabs API key required to list agents');
}
