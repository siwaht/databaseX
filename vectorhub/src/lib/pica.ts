import { env } from './env';

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
    if (!env.picaSecretKey || !env.picaWeaviateConnectionKey) {
        console.warn('Missing Pica credentials. Ensure PICA_SECRET_KEY and PICA_WEAVIATE_CONNECTION_KEY are set.');
    }

    const response = await fetch('https://api.picaos.com/v1/passthrough/v1/objects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-pica-secret': env.picaSecretKey,
            'x-pica-connection-key': env.picaWeaviateConnectionKey,
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
