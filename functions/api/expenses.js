// functions/api/expenses.js
export async function onRequest(context) {
  const { request, env } = context;
  
  console.log('🎯 Cloudflare Function called');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method === 'GET') {
    try {
      const token = env.AIRTABLE_TOKEN;
      const baseId = env.AIRTABLE_BASE_ID;
      
      if (!token || !baseId) {
        console.log('Missing env vars, using fallback');
        // KEMBALIKAN ARRAY, BUKAN OBJECT!
        return new Response(JSON.stringify([
          { id: "fallback1", employeeName: "Test Data 1", amount: 100000 },
          { id: "fallback2", employeeName: "Test Data 2", amount: 200000 }
        ]), { status: 200, headers });
      }

      const url = `https://api.airtable.com/v0/${baseId}/Expenses`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`Airtable error: ${response.status}`);
      
      const data = await response.json();
      
// TRANSFORM KE ARRAY DENGAN SEMUA FIELD
const expenses = data.records.map(record => ({
  id: record.id,
  airtableId: record.id,
  
  // Employee Information
  employeeName: record.fields.employeeName || '',
  name: record.fields.employeeName || '',
  division: record.fields.division || '',
  manager: record.fields.manager || '',
  
  // Expense Details
  date: record.fields.expenseDate || '',
  expenseDate: record.fields.expenseDate || '',
  type: record.fields.expenseType || 'reimbursement',
  expenseType: record.fields.expenseType || 'reimbursement',
  category: record.fields.category || 'other',
  project: record.fields.project || '',
  description: record.fields.description || '',
  amount: Number(record.fields.amount || 0),
  
  // Payment & Status
  paymentMethod: record.fields.paymentMethod || 'bank-transfer',
  urgency: record.fields.urgency || 'normal',
  status: record.fields.status || 'pending',
  paymentStatus: record.fields.paymentStatus || 'pending',
  hasAttachment: Boolean(record.fields.hasAttachment),
  
  // Approval Tracking
  submittedDate: record.fields.submittedDate || '',
  lastUpdated: record.fields.lastUpdated || '',
  subApprovedBy: record.fields.subApprovedBy || '',
  subApprovedDate: record.fields.subApprovedDate || '',
  approvedBy: record.fields.approvedBy || '',
  approvalDate: record.fields.approvalDate || '',
  paidBy: record.fields.paidBy || '',
  paymentDate: record.fields.paymentDate || '',
  rejectionReason: record.fields.rejectionReason || '',
  
  source: 'airtable'
}));
      
      // PASTIKAN RETURN ARRAY
      return new Response(JSON.stringify(expenses), { 
        status: 200, 
        headers 
      });
      
    } catch (error) {
      console.error('Error:', error);
      // FALLBACK TETAP ARRAY
      return new Response(JSON.stringify([
        { id: "error1", employeeName: "Error Mode", amount: 0 }
      ]), { status: 200, headers });
    }
  }

  return new Response('[]', { status: 405, headers });
}