export async function onRequest(context) {
    const { env } = context;
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    // Test GET ke Airtable
    let getTest = { success: false };
    try {
        const getUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses?maxRecords=1`;
        const getResponse = await fetch(getUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        getTest = {
            success: getResponse.ok,
            status: getResponse.status,
            statusText: getResponse.statusText
        };
        
        if (getResponse.ok) {
            const data = await getResponse.json();
            getTest.recordCount = data.records?.length || 0;
            if (data.records?.length > 0) {
                getTest.sampleFields = Object.keys(data.records[0].fields);
                getTest.sampleRecord = data.records[0].fields;
            }
        } else {
            const errorText = await getResponse.text();
            getTest.error = errorText.substring(0, 200);
        }
    } catch (error) {
        getTest.error = error.message;
    }

    // Test POST minimal ke Airtable
    let postTest = { success: false };
    try {
        const postUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses`;
        const postResponse = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    employeeName: "Test from Cloudflare",
                    amount: 1000
                }
            })
        });
        
        postTest = {
            success: postResponse.ok,
            status: postResponse.status,
            statusText: postResponse.statusText
        };
        
        const responseText = await postResponse.text();
        postTest.response = responseText.substring(0, 300);
        
    } catch (error) {
        postTest.error = error.message;
    }

    return new Response(JSON.stringify({
        env: {
            tokenExists: !!env.AIRTABLE_TOKEN,
            tokenLength: env.AIRTABLE_TOKEN ? env.AIRTABLE_TOKEN.length : 0,
            baseIdExists: !!env.AIRTABLE_BASE_ID,
            baseIdValue: env.AIRTABLE_BASE_ID
        },
        getTest,
        postTest
    }, null, 2), { headers });
}