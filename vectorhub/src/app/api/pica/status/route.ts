import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function GET() {
    return NextResponse.json({
        weaviate: !!env.picaSecretKey && !!env.picaWeaviateConnectionKey,
        supabase: !!env.picaSecretKey && !!env.picaSupabaseConnectionKey,
        mongodb: !!env.picaSecretKey && !!env.picaMongoDbAtlasConnectionKey,
    });
}
