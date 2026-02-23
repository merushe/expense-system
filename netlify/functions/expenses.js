// netlify/functions/expenses.js - VERSI SUPER SIMPLE
exports.handler = async function(event, context) {
  console.log('🎯 Function dipanggil');
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'Function berjalan dengan baik',
      records: [] // Kirim array kosong dulu
    })
  };
};