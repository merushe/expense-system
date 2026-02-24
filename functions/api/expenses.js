// functions/api/expenses.js
export async function onRequest(context) {
  const { request, env } = context;
  
  console.log('🎯 Cloudflare Function called');
  console.log('🔍 ENV CHECK:');
  console.log('- Token exists:', !!env.AIRTABLE_TOKEN);
  console.log('- Token length:', env.AIRTABLE_TOKEN ? env.AIRTABLE_TOKEN.length : 0);
  console.log('- Base ID exists:', !!env.AIRTABLE_BASE_ID);
  console.log('- Base ID value:', env.AIRTABLE_BASE_ID);
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  // Handle OPTIONS request (CORS preflight)
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // HANDLER GET - Ambil semua data (YANG SUDAH ADA)
  if (request.method === 'GET') {
    try {
      const token = env.AIRTABLE_TOKEN;
      const baseId = env.AIRTABLE_BASE_ID;
      
      if (!token || !baseId) {
        console.log('❌ Missing env vars!');
        return new Response(JSON.stringify([
          { id: "fallback1", employeeName: "Env Vars Missing", amount: 0 }
        ]), { status: 200, headers });
      }

      console.log('🌐 Fetching from Airtable...');
      const url = `https://api.airtable.com/v0/${baseId}/Expenses`;
      console.log('URL:', url);
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Airtable response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Airtable error response:', errorText);
        throw new Error(`Airtable error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Airtable success, records:', data.records?.length || 0);
      
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
      
      console.log(`📊 Sending ${expenses.length} records`);
      return new Response(JSON.stringify(expenses), { 
        status: 200, 
        headers 
      });
      
    } catch (error) {
      console.error('❌ Function error:', error);
      return new Response(JSON.stringify([
        { 
          id: "error1", 
          employeeName: `Error: ${error.message}`, 
          amount: 0,
          division: 'Check Console',
          manager: 'For Details'
        }
      ]), { status: 200, headers });
    }
  }

  // ===========================================
  // HANDLER POST - Buat data baru (TAMBAHKAN DI SINI!)
  // ===========================================
  if (request.method === 'POST') {
    try {
      console.log('📝 POST request received');
      
      const token = env.AIRTABLE_TOKEN;
      const baseId = env.AIRTABLE_BASE_ID;
      
      if (!token || !baseId) {
        console.log('❌ Missing env vars!');
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Missing environment variables' 
        }), { status: 500, headers });
      }

      // Parse data dari request body
      const requestData = await request.json();
      console.log('📦 Data received:', requestData);

      // Format data untuk Airtable
      const fields = {
        employeeName: requestData.employeeName || '',
        division: requestData.division || '',
        manager: requestData.manager || '',
        expenseDate: requestData.expenseDate || new Date().toISOString().split('T')[0],
        expenseType: requestData.expenseType || 'reimbursement',
        category: requestData.category || 'other',
        project: requestData.project || '',
        description: requestData.description || '',
        amount: Number(requestData.amount) || 0,
        paymentMethod: requestData.paymentMethod || 'bank-transfer',
        urgency: requestData.urgency || 'normal',
        status: requestData.status || 'pending',
        paymentStatus: requestData.paymentStatus || 'pending',
        hasAttachment: Boolean(requestData.hasAttachment),
        submittedDate: requestData.submittedDate || new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      console.log('📤 Sending to Airtable:', fields);

      const url = `https://api.airtable.com/v0/${baseId}/Expenses`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      console.log('Airtable response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Airtable error:', errorText);
        throw new Error(`Airtable error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Record created:', result.id);

      return new Response(JSON.stringify({ 
        success: true, 
        recordId: result.id 
      }), { status: 200, headers });

    } catch (error) {
      console.error('❌ POST error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), { status: 500, headers });
    }
  }

  // Jika method tidak di-handle (PUT, DELETE, dll)
  console.log(`❌ Method not allowed: ${request.method}`);
  return new Response(JSON.stringify({ 
    error: 'Method not allowed' 
  }), { status: 405, headers });
}