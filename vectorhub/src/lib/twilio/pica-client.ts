/**
 * Twilio Data Retrieval via Pica Passthrough API
 */

const PICA_BASE_URL = 'https://api.picaos.com/v1/passthrough';

// Action IDs for different Twilio endpoints
export const TWILIO_ACTION_IDS = {
    LIST_CONVERSATIONS: 'conn_mod_def::GC7Nx4CoQrA::qNBV1R4ZTVSRjQv6b_rZVw',
    FETCH_CONVERSATION: 'conn_mod_def::GC7Nw7DT2kc::kbg6qsr1SS2EOUoeU05yeQ',
    LIST_CHANNEL_MESSAGES: 'conn_mod_def::GC7N9j5OCc8::BnPA2ISUTomJPQdO4osvnw',
    LIST_RECORDING_TRANSCRIPTIONS: 'conn_mod_def::GC7N6itTyF0::erB4TJhcQyWKnvJCTrMe7g',
    FETCH_RECORDING_TRANSCRIPTION: 'conn_mod_def::GC7N6ahD_e0::D-_966dZTMWfZo3wSct_fg',
    FETCH_TRANSCRIPTION: 'conn_mod_def::GC7N6zsX6MQ::uhefSIdxRWSiJxWufo6EAQ',
};

export interface TwilioConversation {
    account_sid: string;
    chat_service_sid: string;
    messaging_service_sid: string;
    sid: string;
    friendly_name: string;
    unique_name: string;
    attributes: string;
    state: string;
    date_created: string;
    date_updated: string;
    timers: Record<string, unknown>;
    url: string;
    links: Record<string, string>;
    bindings: Record<string, unknown>;
}

export interface TwilioMessage {
    sid: string;
    account_sid: string;
    attributes: string;
    service_sid: string;
    to: string;
    channel_sid: string;
    date_created: string;
    date_updated: string;
    last_updated_by: string;
    was_edited: boolean;
    from: string;
    body: string;
    index: number;
    type: string;
    media: Record<string, unknown>;
    url: string;
}

export interface TwilioTranscription {
    account_sid: string;
    api_version: string;
    date_created: string;
    date_updated: string;
    duration: string;
    price: number;
    price_unit: string;
    recording_sid: string;
    sid: string;
    status: string;
    transcription_text: string;
    type: string;
    uri: string;
}

export interface PicaConfig {
    secretKey: string;
    connectionKey: string;
}

export async function fetchTwilioData<T>(
    endpoint: string,
    actionId: string,
    config: PicaConfig,
    query: Record<string, string | number> = {}
): Promise<T> {
    const url = new URL(`${PICA_BASE_URL}${endpoint}`);
    Object.entries(query).forEach(([key, value]) => 
        url.searchParams.append(key, String(value))
    );

    const resp = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'x-pica-secret': config.secretKey,
            'x-pica-connection-key': config.connectionKey,
            'x-pica-action-id': actionId,
            'Accept': 'application/json',
        },
    });

    if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Pica API error: ${resp.status} - ${errorText}`);
    }

    return resp.json();
}

// List all Twilio conversations
export async function listConversations(
    config: PicaConfig,
    pageSize: number = 50
): Promise<{ conversations: TwilioConversation[]; meta: Record<string, unknown> }> {
    return fetchTwilioData(
        '/v1/Conversations',
        TWILIO_ACTION_IDS.LIST_CONVERSATIONS,
        config,
        { PageSize: pageSize }
    );
}

// Fetch a specific conversation
export async function fetchConversation(
    config: PicaConfig,
    sid: string
): Promise<TwilioConversation> {
    return fetchTwilioData(
        `/v1/Conversations/${sid}`,
        TWILIO_ACTION_IDS.FETCH_CONVERSATION,
        config
    );
}

// List messages in a channel
export async function listChannelMessages(
    config: PicaConfig,
    serviceSid: string,
    channelSid: string,
    options: { order?: 'asc' | 'desc'; pageSize?: number } = {}
): Promise<{ messages: TwilioMessage[]; meta: Record<string, unknown> }> {
    const query: Record<string, string | number> = {};
    if (options.order) query.Order = options.order;
    if (options.pageSize) query.PageSize = options.pageSize;

    return fetchTwilioData(
        `/v2/Services/${serviceSid}/Channels/${channelSid}/Messages`,
        TWILIO_ACTION_IDS.LIST_CHANNEL_MESSAGES,
        config,
        query
    );
}

// List transcriptions for a recording
export async function listRecordingTranscriptions(
    config: PicaConfig,
    accountSid: string,
    recordingSid: string,
    pageSize: number = 50
): Promise<{ transcriptions: TwilioTranscription[] }> {
    return fetchTwilioData(
        `/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}/Transcriptions.json`,
        TWILIO_ACTION_IDS.LIST_RECORDING_TRANSCRIPTIONS,
        config,
        { PageSize: pageSize }
    );
}

// Fetch a specific recording transcription
export async function fetchRecordingTranscription(
    config: PicaConfig,
    accountSid: string,
    recordingSid: string,
    transcriptionSid: string
): Promise<TwilioTranscription> {
    return fetchTwilioData(
        `/Accounts/${accountSid}/Recordings/${recordingSid}/Transcriptions/${transcriptionSid}.json`,
        TWILIO_ACTION_IDS.FETCH_RECORDING_TRANSCRIPTION,
        config
    );
}

// Fetch any transcription by SID
export async function fetchTranscription(
    config: PicaConfig,
    accountSid: string,
    transcriptionSid: string
): Promise<TwilioTranscription> {
    return fetchTwilioData(
        `/Accounts/${accountSid}/Transcriptions/${transcriptionSid}.json`,
        TWILIO_ACTION_IDS.FETCH_TRANSCRIPTION,
        config
    );
}
