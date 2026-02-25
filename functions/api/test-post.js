export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    // Test POST dengan data PALING SEDERHANA
    try {
        const token = env.AIRTABLE_TOKEN;
        const baseId = env.AIRTABLE_BASE_ID;
        
        // Data minimal yang PASTI ada di Airtable
        const testData = {
            fields: {
                employeeName: "Test from Cloudflare",
                amount: 5000
            }
        };

        console.log('📤 Test POST to Airtable:', JSON.stringify(testData));

        const response = await fetch(`https://api.airtable.com/v0/${baseId}/Expenses`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const responseText = await response.text();
        
        return new Response(JSON.stringify({
            status: response.status,
            ok: response.ok,
            response: responseText.substring(0, 500),
            headers: Object.fromEntries(response.headers)
        }), { headers });

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), { status: 500, headers });
    }
}