import { listSupabaseSnippets, createMongoOnlineArchive } from '../src/lib/pica';
import { env } from '../src/lib/env';

async function testPicaExtension() {
    console.log('Testing Pica Extension (Supabase & MongoDB)...');
    console.log(`PICA_SECRET_KEY present: ${!!process.env.PICA_SECRET_KEY}`);
    console.log(`PICA_SUPABASE_CONNECTION_KEY present: ${!!process.env.PICA_SUPABASE_CONNECTION_KEY}`);
    console.log(`PICA_MONGO_DB_ATLAS_CONNECTION_KEY present: ${!!process.env.PICA_MONGO_DB_ATLAS_CONNECTION_KEY}`);

    // Test Supabase (Safe Read)
    try {
        if (process.env.PICA_SUPABASE_CONNECTION_KEY) {
            console.log('\n--- Testing Supabase Snippets List ---');
            const snippets = await listSupabaseSnippets({ limit: '5' });
            console.log(`✅ Supabase: Successfully listed ${snippets.data.length} snippets.`);
            if (snippets.data.length > 0) {
                console.log('Sample snippet:', snippets.data[0].name);
            }
        } else {
            console.log('\n⚠️ Skipping Supabase test: Missing PICA_SUPABASE_CONNECTION_KEY');
        }
    } catch (error) {
        console.error('❌ Supabase test failed:', error);
    }

    // Test MongoDB (Dry Run / Validation only)
    try {
        if (process.env.PICA_MONGO_DB_ATLAS_CONNECTION_KEY) {
            console.log('\n--- Testing MongoDB Online Archive (Mock) ---');
            console.log('ℹ️  Real creation requires valid GroupID and ClusterName. Skipping actual POST to avoid side effects.');
            // Un-comment to actually test if you have valid IDs:
            /*
            const result = await createMongoOnlineArchive('your-group-id', 'your-cluster-name', {
                collName: 'test_collection',
                dbName: 'admin',
                criteria: { type: 'DATE' }
            });
            console.log('MongoDB Result:', result);
            */
        } else {
            console.log('\n⚠️ Skipping MongoDB test: Missing PICA_MONGO_DB_ATLAS_CONNECTION_KEY');
        }
    } catch (error) {
        console.error('❌ MongoDB test failed:', error);
    }
}

testPicaExtension();
