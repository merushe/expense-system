// netlify/functions/expenses.js - SIAPKAN DULU
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = 'Expenses';

exports.handler = async function(event, context) {
  console.log('🎯 Function dipanggil - Airtable version');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // Cek dulu apakah env variable ada
    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      console.log('⚠️ Environment variable belum diset, pakai dummy');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([
          { id: "rec1", employeeName: "Data sementara", amount: 100000 }
        ])
      };
    }
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!response.ok) throw new Error(`Airtable error: ${response.status}`);
    
    const data = await response.json();
    const expenses = data.records.map(record => ({
      id: record.id,
      employeeName: record.fields.employeeName || '',
      amount: record.fields.amount || 0,
      category: record.fields.category || 'other',
      status: record.fields.status || 'pending',
    }));
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(expenses)
    };
    
  } catch (error) {
    console.error('Error:', error);
    // Fallback ke dummy data
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([
        { id: "rec1", employeeName: "Fallback Mode", amount: 150000 }
      ])
    };
  }
};