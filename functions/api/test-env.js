export async function onRequest(context) {
    const { env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    return new Response(JSON.stringify({
        tokenExists: !!env.AIRTABLE_TOKEN,
        tokenLength: env.AIRTABLE_TOKEN ? env.AIRTABLE_TOKEN.length : 0,
        tokenFirstChars: env.AIRTABLE_TOKEN ? env.AIRTABLE_TOKEN.substring(0, 10) + '...' : 'none',
        baseIdExists: !!env.AIRTABLE_BASE_ID,
        baseIdValue: env.AIRTABLE_BASE_ID || 'not set',
        // Test koneksi Airtable via API
        testUrl: `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses?maxRecords=1`
    }), { headers });
}