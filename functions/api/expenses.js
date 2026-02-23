// functions/api/expenses.js
export async function onRequest(context) {
  const { request, env } = context;
  
  console.log('🎯 Cloudflare Function called');
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Hanya handle GET
  if (request.method === 'GET') {
    try {
      const AIRTABLE_TOKEN = env.AIRTABLE_TOKEN;
      const AIRTABLE_BASE_ID = env.AIRTABLE_BASE_ID;
      
      if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
        throw new Error('Missing environment variables');
      }

      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Expenses`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
      });
      
      if (!response.ok) {
        throw new Error(`Airtable error: ${response.status}`);
      }
      
      const data = await response.json();
      const expenses = data.records.map(record => ({
        id: record.id,
        employeeName: record.fields.employeeName || '',
        amount: record.fields.amount || 0,
        category: record.fields.category || 'other',
        status: record.fields.status || 'pending',
      }));
      
      return new Response(JSON.stringify(expenses), { 
        status: 200, 
        headers 
      });
      
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        fallback: true,
        data: [
          { id: "rec1", employeeName: "Mode Offline", amount: 150000 }
        ]
      }), { status: 200, headers });
    }
  }

  return new Response('Method not allowed', { status: 405, headers });
}

