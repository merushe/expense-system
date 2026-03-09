// functions/_worker.js
export default {
    async fetch(request, env) {
        console.log('Base ID:', env.AIRTABLE_BASE_ID);
        console.log('Token exists:', !!env.AIRTABLE_TOKEN);
        
        const url = new URL(request.url);
        
        // ===== REDIRECT ROOT =====
        if (url.pathname === '/') {
            return new Response(null, {
                status: 302,
                headers: { 'Location': '/Dashboard.html' }
            });
        }
        
        // CORS headers
        const headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

// ========== TEST AIRTABLE CONNECTION ==========
if (url.pathname === '/api/test-users') {
    try {
        console.log('Testing Airtable connection...');
        console.log('Base ID:', env.AIRTABLE_BASE_ID);
        console.log('Token exists:', !!env.AIRTABLE_TOKEN);
        
        // Coba ambil 1 record dari tabel Users
        const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users?maxRecords=1`;
        
        const response = await fetch(airtableUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Airtable error:', errorText);
            return new Response(JSON.stringify({
                success: false,
                status: response.status,
                statusText: response.statusText,
                error: errorText
            }), { headers });
        }
        
        const data = await response.json();
        console.log('Airtable data:', data);
        
        return new Response(JSON.stringify({
            success: true,
            records: data.records,
            recordCount: data.records?.length || 0
        }), { headers });
        
    } catch (error) {
        console.error('Test endpoint error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), { status: 500, headers });
    }
}

// ========== TEST ENDPOINT UNTUK CEK USER ==========
if (url.pathname === '/api/debug-user') {
    try {
        const email = url.searchParams.get('email') || 'rmersiana@biaenergi.com';
        console.log('Debug user untuk email:', email);
        
        // Coba ambil user dari Airtable
        const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users?filterByFormula={email}="${email}"`;
        console.log('Airtable URL:', airtableUrl);
        
        const response = await fetch(airtableUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({
                success: false,
                status: response.status,
                error: errorText
            }), { headers });
        }
        
        const data = await response.json();
        
        // Log lengkap
        return new Response(JSON.stringify({
            success: true,
            records: data.records,
            count: data.records?.length || 0,
            fields: data.records?.[0]?.fields || null,
            raw: data
        }, null, 2), { 
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack
        }), { status: 500, headers });
    }
}

// ========== AUTH ENDPOINT ==========
if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    try {
        const { email, password } = await request.json();
        console.log('Login attempt for email:', email);
        
        const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users?filterByFormula={email}="${email}"`;
        console.log('Airtable URL:', airtableUrl);
        
        const response = await fetch(airtableUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        const data = await response.json();
        console.log('Airtable response:', data);
        
        // Cek apakah user ditemukan
        if (data.records && data.records.length > 0) {
            const user = data.records[0].fields;
            
 // Simple password check
if (user.password === password) {  // <-- GANTI password123 menjadi password
    // Login sukses
    return new Response(JSON.stringify({
        success: true,
        user: {
            email: user.email,
            name: user.name,
            role: user.role,
            division: user.division,
            managerEmail: user.managerEmail
        }
    }), { headers });
} else {
    // Password salah
    return new Response(JSON.stringify({
        success: false,
        error: 'Email atau password salah'
    }), { headers });
} else {
            // Email tidak ditemukan
            return new Response(JSON.stringify({
                success: false,
                error: 'Email atau password salah'
            }), { headers });
        }
        
    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Terjadi kesalahan server'
        }), { status: 500, headers });
    }
}

// ENDPOINT GANTI PASSWORD
if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
    try {
        const { email, oldPassword, newPassword } = await request.json();
        
        // Verifikasi old password
        const userUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users?filterByFormula={email}="${email}"`;
        const userResponse = await fetch(userUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        const userData = await userResponse.json();
        
        if (!userData.records || userData.records.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'User not found' }), { headers });
        }
        
        const recordId = userData.records[0].id;
        const currentPassword = userData.records[0].fields.password;
        
        if (currentPassword !== oldPassword) {
            return new Response(JSON.stringify({ success: false, error: 'Password lama salah' }), { headers });
        }
        
        // Update password di Airtable
        const updateUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users/${recordId}`;
        const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: { password: newPassword } })
        });
        
        const result = await updateResponse.json();
        
        return new Response(JSON.stringify({
            success: updateResponse.ok,
            data: result
        }), { headers });
        
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers });
    }
}

        // Handle OPTIONS
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers });
        }

        // ========== KHUSUS UNTUK FILE STATIS ==========
        // Jika mengakses file HTML, CSS, JS, dll, biarkan Cloudflare yang handle
        if (url.pathname.endsWith('.html') || 
            url.pathname.endsWith('.js') || 
            url.pathname.endsWith('.css') || 
            url.pathname.endsWith('.ico') ||
            !url.pathname.startsWith('/api')) {
            
            // Biarkan Cloudflare serve file statis
            return env.ASSETS.fetch(request);
        }

        // ========== API ENDPOINTS ==========
        // TEST ENDPOINTS
        if (url.pathname === '/api/hello' || url.pathname === '/hello') {
            return new Response(JSON.stringify({
                success: true,
                message: 'Hello from Worker!'
            }), { headers });
        }

        if (url.pathname === '/api/test' || url.pathname === '/test') {
            return new Response(JSON.stringify({
                success: true,
                message: 'API test berhasil!',
                time: new Date().toISOString()
            }), { headers });
        }

        // ENDPOINT AIRTABLE
        if (url.pathname === '/api/expenses') {
            // GET
            if (request.method === 'GET') {
                try {
                    const response = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses`, {
                        headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
                    });
                    const data = await response.json();
                    return new Response(JSON.stringify(data.records || []), { headers });
                } catch (error) {
                    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
                }
            }
            
            // POST
            if (request.method === 'POST') {
                try {
                    const data = await request.json();
                    
                    const fields = {
                        employeeName: data.employeeName || 'Test',
                        division: data.division || 'Business Administration',
                        manager: data.manager || 'Laras Setyowinanti',
                        expenseDate: data.expenseDate || new Date().toISOString().split('T')[0],
                        expenseType: data.expenseType || 'reimbursement',
                        category: data.category || 'other',
                        project: data.project || 'General',
                        description: data.description || 'No description',
                        amount: Number(data.amount) || 0,
                        paymentMethod: data.paymentMethod || 'bank-transfer',
                        urgency: data.urgency || 'normal',
                        status: 'pending',
                        paymentStatus: 'pending',
                        hasAttachment: false,
                        submittedDate: new Date().toISOString().split('T')[0],
                        lastUpdated: new Date().toISOString().split('T')[0]
                    };

                    const response = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ fields })
                    });
                    
                    const result = await response.json();
                    
                    return new Response(JSON.stringify({
                        success: response.ok,
                        status: response.status,
                        data: result
                    }), { headers });
                    
                } catch (error) {
                    return new Response(JSON.stringify({
                        success: false,
                        error: error.message
                    }), { status: 500, headers });
                }
            }
        }

// ENDPOINT UPDATE EXPENSE
if (url.pathname.startsWith('/api/expenses/') && request.method === 'PUT') {
    try {
        // Ambil ID dari URL
        const id = url.pathname.split('/').pop();
        
        // Parse data update
        const updateData = await request.json();
        
        console.log('Updating expense:', id, updateData);
        
        // Kirim ke Airtable (gunakan PATCH untuk update parsial)
        const response = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Expenses/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${env.AIRTABLE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: updateData })
        });
        
        const result = await response.json();
        console.log('Airtable response:', result);
        
        return new Response(JSON.stringify({
            success: response.ok,
            status: response.status,
            data: result
        }), { headers });
        
    } catch (error) {
        console.error('Error updating expense:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), { status: 500, headers });
    }
}

// ========== USERS ENDPOINTS ==========

// GET /api/users - Ambil semua users
if (url.pathname === '/api/users' && request.method === 'GET') {
    try {
        const response = await fetch(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users`, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        // Tambahkan pengecekan response.ok
        if (!response.ok) {
            throw new Error(`Airtable error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ✅ PERBAIKAN: Cek dulu apakah data.records ada
        if (!data.records) {
            return new Response(JSON.stringify([]), { headers });
        }
        
        const users = data.records.map(record => ({
            id: record.id,
            fields: record.fields
        }));
        
        return new Response(JSON.stringify(users), { headers });
    } catch (error) {
        console.error('Error fetching users:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { status: 500, headers });
    }
}

// GET /api/users/:email - Ambil user by email
if (url.pathname.startsWith('/api/users/') && request.method === 'GET') {
    try {
        const email = decodeURIComponent(url.pathname.split('/').pop());
        
        // Query Airtable dengan filter by email
        const airtableUrl = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/Users?filterByFormula={email}="${email}"`;
        
        const response = await fetch(airtableUrl, {
            headers: { 'Authorization': `Bearer ${env.AIRTABLE_TOKEN}` }
        });
        
        const data = await response.json();
        
        if (data.records && data.records.length > 0) {
            const user = data.records[0];
            return new Response(JSON.stringify({
                id: user.id,
                fields: user.fields
            }), { headers });
        } else {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'User not found' 
            }), { status: 404, headers });
        }
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), { status: 500, headers });
    }
}

        // Default response untuk API yang tidak dikenal
        return new Response(JSON.stringify({
            success: false,
            error: 'API endpoint not found',
            path: url.pathname
        }), { status: 404, headers });
    }
};