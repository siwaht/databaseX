import { dynamicPicaConfig } from './dynamic-env';

export interface WeaviateDocument {
    class: string;
    id?: string;
    properties: Record<string, any>;
    vector?: number[];
    vectorWeights?: Record<string, number>;
    tenant?: string;
    additional?: Record<string, any>;
}

export interface PicaWeaviateResponse {
    id: string; // The UUID of the object in Weaviate
    [key: string]: any;
}

/**
 * Creates or updates an object in Weaviate via the Pica Edge Function passthrough.
 * 
 * @param doc The Weaviate document structure to create
 * @returns The created object response from Weaviate/Pica
 */
export async function createWeaviateDocument(doc: WeaviateDocument): Promise<PicaWeaviateResponse> {
    if (!dynamicPicaConfig.secretKey || !dynamicPicaConfig.weaviateKey) {
        console.warn('Missing Pica credentials. Ensure PICA_SECRET_KEY and PICA_WEAVIATE_CONNECTION_KEY are set.');
    }

    const response = await fetch('https://api.picaos.com/v1/passthrough/v1/objects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-pica-secret': dynamicPicaConfig.secretKey,
            'x-pica-connection-key': dynamicPicaConfig.weaviateKey,
            'x-pica-action-id': 'conn_mod_def::GC_6t2UcL3M::lk1uyIPORfaW0ZbperpNpA'
        },
        body: JSON.stringify(doc)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create Weaviate document via Pica: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

// --- Supabase Interfaces ---

export interface SupabaseSnippet {
    id: string;
    inserted_at: string;
    updated_at: string;
    type: 'sql';
    visibility: 'user' | 'project';
    name: string;
    description?: string;
    project: {
        id: number;
        name: string;
    };
    owner: {
        id: number;
        username: string;
    };
    updated_by: {
        id: number;
        username: string;
    };
}

export interface ListSupabaseSnippetsParams {
    cursor?: string;
    limit?: string;
    sort_by?: 'name' | 'inserted_at';
    sort_order?: 'asc' | 'desc';
    project_ref?: string;
}

export interface SupabaseSnippetsResponse {
    data: SupabaseSnippet[];
    cursor?: string;
}

// --- MongoDB Interfaces ---

export interface MongoOnlineArchiveConfig {
    collName: string;
    dbName: string;
    criteria: {
        type: 'DATE' | 'CUSTOM';
        // Add other criteria fields if needed
    };
    // Add other optional fields from schema as needed
    [key: string]: any;
}

export interface MongoOnlineArchiveResponse {
    _id: string;
    clusterName: string;
    collName: string;
    dbName: string;
    state: string;
    [key: string]: any;
}

// --- Supabase Functions ---

/**
 * Lists SQL snippets from Supabase via Pica Edge Function.
 */
export async function listSupabaseSnippets(params: ListSupabaseSnippetsParams = {}): Promise<SupabaseSnippetsResponse> {
    if (!dynamicPicaConfig.secretKey || !dynamicPicaConfig.supabaseKey) {
        console.warn('Missing Pica Supabase credentials.');
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
    });

    const url = `https://api.picaos.com/v1/passthrough/v1/snippets?${queryParams.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-pica-secret': dynamicPicaConfig.secretKey,
            'x-pica-connection-key': dynamicPicaConfig.supabaseKey,
            'x-pica-action-id': 'conn_mod_def::GC40SSqjgKI::vys6h_oeS6OSLMbQ4kszcg'
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to list Supabase snippets via Pica: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}

// --- MongoDB Functions ---

/**
 * Creates an Online Archive in MongoDB Atlas via Pica Edge Function.
 */
export async function createMongoOnlineArchive(
    groupId: string,
    clusterName: string,
    config: MongoOnlineArchiveConfig
): Promise<MongoOnlineArchiveResponse> {
    if (!dynamicPicaConfig.secretKey || !dynamicPicaConfig.mongoKey) {
        console.warn('Missing Pica MongoDB credentials.');
    }

    const url = `https://api.picaos.com/v1/passthrough/groups/${groupId}/clusters/${clusterName}/onlineArchives`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/vnd.atlas.2023-01-01+json',
            'x-pica-secret': dynamicPicaConfig.secretKey,
            'x-pica-connection-key': dynamicPicaConfig.mongoKey,
            'x-pica-action-id': 'conn_mod_def::GEubJKD0RjM::C1PZX0IXQtuRnNVdCm5YBA'
        },
        body: JSON.stringify(config)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create MongoDB Online Archive via Pica: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
}
