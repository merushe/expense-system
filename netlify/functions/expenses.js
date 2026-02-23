// netlify/functions/expenses.js - Versi dengan response array
exports.handler = async function(event, context) {
  console.log('🎯 Function dipanggil');
  
  // Data dummy untuk testing (nanti diganti dengan data Airtable asli)
  const dummyData = [
    {
      id: "rec1",
      employeeName: "John Doe",
      amount: 150000,
      category: "travel",
      status: "pending"
    },
    {
      id: "rec2", 
      employeeName: "Jane Smith",
      amount: 250000,
      category: "meals",
      status: "approved"
    }
  ];
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(dummyData) // LANGSUNG array, bukan object { records: [] }
  };
};