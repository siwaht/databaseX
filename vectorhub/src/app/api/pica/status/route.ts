import { NextResponse } from 'next/server';
import { dynamicPicaConfig } from '@/lib/dynamic-env';

export async function GET() {
    return NextResponse.json({
        weaviate: !!dynamicPicaConfig.secretKey && !!dynamicPicaConfig.weaviateKey,
        supabase: !!dynamicPicaConfig.secretKey && !!dynamicPicaConfig.supabaseKey,
        mongodb: !!dynamicPicaConfig.secretKey && !!dynamicPicaConfig.mongoKey,
    });
}
