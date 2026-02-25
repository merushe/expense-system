export async function onRequest(context) {
    const { env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    // Test koneksi ke Airtable
    let airtableConnection = { success: false };
    
    try {
        const testUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses?maxRecords=1`;
        const response = await fetch(testUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        airtableConnection = {
            success: response.ok,
            status: response.status,
            statusText: response.statusText
        };
        
        if (response.ok) {
            const data = await response.json();
            airtableConnection.recordCount = data.records?.length || 0;
            if (data.records?.length > 0) {
                airtableConnection.sampleFields = Object.keys(data.records[0].fields);
            }
        } else {
            const errorText = await response.text();
            airtableConnection.error = errorText.substring(0, 100);
        }
    } catch (error) {
        airtableConnection.error = error.message;
    }

    return new Response(JSON.stringify({
        environment: {
            tokenExists: !!env.AIRTABLE_TOKEN,
            tokenLength: env.AIRTABLE_TOKEN ? env.AIRTABLE_TOKEN.length : 0,
            tokenFirstChars: env.AIRTABLE_TOKEN ? env.AIRTABLE_TOKEN.substring(0, 10) + '...' : 'none',
            baseIdExists: !!env.AIRTABLE_BASE_ID,
            baseIdValue: env.AIRTABLE_BASE_ID || 'not set'
        },
        airtableConnection: airtableConnection
    }, null, 2), { headers });
}