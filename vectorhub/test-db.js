const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function testConnection() {
    console.log("Checking DATABASE_URL from .env...");

    let dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        try {
            const envPath = path.join(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/DATABASE_URL=(.*)/);
                if (match && match[1]) {
                    dbUrl = match[1].trim();
                    // Remove quotes if present
                    if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
                        dbUrl = dbUrl.slice(1, -1);
                    }
                }
            }
        } catch (e) {
            console.error("Error reading .env:", e.message);
        }
    }

    if (!dbUrl) {
        console.error("❌ DATABASE_URL not found in environment or .env file.");
        return;
    }
    console.log("DATABASE_URL found (masked):", dbUrl.replace(/:[^:@]+@/, ':***@'));

    const pool = new Pool({
        connectionString: dbUrl,
    });

    try {
        console.log("Attempting to connect to database...");
        const client = await pool.connect();
        console.log("✅ Successfully connected to database!");

        const res = await client.query('SELECT NOW()');
        console.log("Current database time:", res.rows[0]);

        // Also check if users table exists
        const tableRes = await client.query(`SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE  table_schema = 'public'
            AND    table_name   = 'users'
        );`);
        console.log("Users table exists:", tableRes.rows[0].exists);

        client.release();
    } catch (err) {
        console.error("❌ Failed to connect to database:", err.message);
        if (err.code) console.error("Error code:", err.code);
    } finally {
        await pool.end();
    }
}

testConnection();
