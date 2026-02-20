// Di bagian paling atas expenses.js, tambahkan:
console.log('=== FUNCTIONS STARTED ===');
console.log('Token exists:', !!process.env.AIRTABLE_TOKEN);
console.log('Base ID exists:', !!process.env.AIRTABLE_BASE_ID);

// netlify/functions/expenses.js
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE = 'Expenses';

exports.handler = async function(event, context) {
  // Log untuk debugging (akan muncul di Functions log)
  console.log('=== FUNCTIONS DEBUG ===');
  console.log('Token exists:', !!AIRTABLE_TOKEN);
  console.log('Token length:', AIRTABLE_TOKEN ? AIRTABLE_TOKEN.length : 0);
  console.log('Base ID:', AIRTABLE_BASE_ID);
  console.log('HTTP Method:', event.httpMethod);
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    // Route berdasarkan path dan method
    const path = event.path.replace('/.netlify/functions/expenses', '');
    const segments = path.split('/').filter(Boolean);
    
    // GET / - ambil semua expenses
    if (event.httpMethod === 'GET' && segments.length === 0) {
      return await handleGetAllExpenses(headers);
    }
    
    // GET /:id - ambil satu expense
    if (event.httpMethod === 'GET' && segments.length === 1) {
      return await handleGetExpense(segments[0], headers);
    }
    
    // POST / - create new expense
    if (event.httpMethod === 'POST' && segments.length === 0) {
      const data = JSON.parse(event.body);
      return await handleCreateExpense(data, headers);
    }
    
    // PATCH /:id - update expense
    if (event.httpMethod === 'PATCH' && segments.length === 1) {
      const data = JSON.parse(event.body);
      return await handleUpdateExpense(segments[0], data, headers);
    }
    
    // DELETE /:id - delete expense
    if (event.httpMethod === 'DELETE' && segments.length === 1) {
      return await handleDeleteExpense(segments[0], headers);
    }
    
    // Route tidak ditemukan
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Handler: GET semua expenses
async function handleGetAllExpenses(headers) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
    console.log('Fetching from Airtable:', url);
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform data ke format yang sama seperti sebelumnya
    const expenses = data.records.map(record => ({
      id: record.id,
      airtableId: record.id,
      employeeName: record.fields.employeeName || '',
      name: record.fields.employeeName || '',
      division: record.fields.division || '',
      manager: record.fields.manager || '',
      date: record.fields.expenseDate || '',
      expenseDate: record.fields.expenseDate || '',
      type: record.fields.expenseType || 'reimbursement',
      expenseType: record.fields.expenseType || 'reimbursement',
      category: record.fields.category || 'other',
      project: record.fields.project || '',
      description: record.fields.description || '',
      amount: Number(record.fields.amount || 0),
      paymentMethod: record.fields.paymentMethod || 'bank-transfer',
      urgency: record.fields.urgency || 'normal',
      status: record.fields.status || 'pending',
      paymentStatus: record.fields.paymentStatus || 'pending',
      hasAttachment: Boolean(record.fields.hasAttachment),
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
    
    console.log(`✅ Got ${expenses.length} records`);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(expenses)
    };
  } catch (error) {
    console.error('Error fetching from Airtable:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

// Handler: GET satu expense
async function handleGetExpense(id, headers) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${id}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('Error fetching expense:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

// Handler: POST create expense
async function handleCreateExpense(data, headers) {
  try {
    console.log('Creating expense:', data);
    
    // Format data untuk Airtable
    const fields = {
      employeeName: data.employeeName || data.name || 'Unknown',
      division: data.division || 'Unknown',
      manager: data.manager || 'Unknown',
      expenseDate: data.expenseDate || data.date || new Date().toISOString().split('T')[0],
      expenseType: data.expenseType || data.type || 'reimbursement',
      category: data.category || 'other',
      project: data.project || 'No Project',
      description: data.description || '',
      amount: Number(data.amount) || 0,
      paymentMethod: data.paymentMethod || 'bank-transfer',
      urgency: data.urgency || 'normal',
      status: data.status || 'pending',
      paymentStatus: data.paymentStatus || 'pending',
      hasAttachment: Boolean(data.hasAttachment),
      submittedDate: data.submittedDate || new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable error: ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Created:', result.id);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, recordId: result.id })
    };
  } catch (error) {
    console.error('Error creating expense:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

// Handler: PATCH update expense
async function handleUpdateExpense(id, data, headers) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${id}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields: data })
    });
    
    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    console.error('Error updating expense:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

// Handler: DELETE expense
async function handleDeleteExpense(id, headers) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${AIRTABLE_TOKEN}` }
    });
    
    if (!response.ok) {
      throw new Error(`Airtable error: ${response.status}`);
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Error deleting expense:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}