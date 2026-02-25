export async function onRequest(context) {
    const { request, env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    // Handle OPTIONS
    if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    // POST - dengan logging
    if (request.method === 'POST') {
        console.log('🔥🔥🔥 POST REQUEST RECEIVED 🔥🔥🔥');
        console.log('Environment:', {
            tokenExists: !!env.AIRTABLE_TOKEN,
            tokenLength: env.AIRTABLE_TOKEN?.length,
            baseId: env.AIRTABLE_BASE_ID
        });
        
        try {
            const requestData = await request.json();
            console.log('📦 Request data:', requestData);
            
            const token = env.AIRTABLE_TOKEN;
            const baseId = env.AIRTABLE_BASE_ID;
            
            const postData = {
                fields: {
                    employeeName: requestData.employeeName || 'Unknown',
                    amount: Number(requestData.amount) || 0
                }
            };
            
            console.log('📤 Sending to Airtable:', JSON.stringify(postData));
            
            const response = await fetch(`https://api.airtable.com/v0/${baseId}/Expenses`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            
            console.log('📊 Airtable status:', response.status);
            
            const responseText = await response.text();
            console.log('📄 Airtable response:', responseText);
            
            if (!response.ok) {
                return new Response(JSON.stringify({ 
                    success: false, 
                    error: `Airtable error: ${response.status}`,
                    details: responseText
                }), { status: 200, headers });
            }
            
            const result = JSON.parse(responseText);
            return new Response(JSON.stringify({ 
                success: true, 
                recordId: result.id 
            }), { status: 200, headers });
            
        } catch (error) {
            console.error('❌ Error:', error);
            return new Response(JSON.stringify({ 
                success: false, 
                error: error.message 
            }), { status: 200, headers });
        }
    }

    // GET
    if (request.method === 'GET') {
        console.log('📥 GET request received');
        return new Response(JSON.stringify({ 
            message: "API is working - Use POST to create expenses"
        }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}