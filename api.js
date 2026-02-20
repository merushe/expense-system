// api.js - VERSI FINAL DENGAN SYNTAX YANG BENAR
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// === DEBUGGING ENV VARIABLES ===
console.log('=== AIRTABLE DEBUG ===');
console.log('1. Token exists:', !!AIRTABLE_TOKEN);
console.log('2. Token length:', AIRTABLE_TOKEN ? AIRTABLE_TOKEN.length : 0);
console.log('3. Token first 10 chars:', AIRTABLE_TOKEN ? AIRTABLE_TOKEN.substring(0, 10) + '...' : 'undefined');
console.log('4. Base ID:', AIRTABLE_BASE_ID);
console.log('5. Node env:', process.env.NODE_ENV);
console.log('========================');

// Definisikan AIRTABLE_CONFIG
const AIRTABLE_CONFIG = {
    API_KEY: AIRTABLE_TOKEN,
    BASE_ID: AIRTABLE_BASE_ID,
    TABLE_NAME: 'Expenses'  // Pastikan nama tabel sesuai
};

console.log('🔧 Airtable Config Loaded');
console.log('Config API Key exists:', !!AIRTABLE_CONFIG.API_KEY);
console.log('Config Base ID:', AIRTABLE_CONFIG.BASE_ID);

window.airtableService = {
    // Test koneksi ke Airtable
    testConnection: async function() {
        try {
            console.log('Testing Airtable connection...');
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}?maxRecords=1`;
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}` }
            });
            
            if (response.ok) {
                console.log('✅ Airtable connection successful');
                return { success: true };
            } else {
                const error = await response.json();
                console.error('❌ Connection failed:', error);
                return { success: false, error: error.error?.message || 'Connection failed' };
            }
        } catch (error) {
            console.error('❌ Connection error:', error);
            return { success: false, error: error.message };
        }
    },

    // Ambil semua data dari Airtable
    getAllExpenses: async function() {
        try {
            const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}`;
            console.log(`Fetching from Airtable: ${url}`);
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Got ${data.records?.length || 0} records from Airtable`);
                
                return data.records?.map(record => {
                    const fields = record.fields || {};
                    
                    return {
                        id: record.id,
                        airtableId: record.id,
                        // Employee Information
                        employeeName: fields.employeeName || '',
                        name: fields.employeeName || '',
                        division: fields.division || '',
                        manager: fields.manager || '',
                        
                        // Expense Details
                        date: fields.expenseDate || '',
                        expenseDate: fields.expenseDate || '',
                        type: fields.expenseType || 'reimbursement',
                        expenseType: fields.expenseType || 'reimbursement',
                        category: fields.category || 'other',
                        project: fields.project || '',
                        description: fields.description || '',
                        amount: Number(fields.amount || 0),
                        
                        // Payment & Status
                        paymentMethod: fields.paymentMethod || 'bank-transfer',
                        urgency: fields.urgency || 'normal',
                        status: fields.status || 'pending',
                        paymentStatus: fields.paymentStatus || 'pending',
                        hasAttachment: Boolean(fields.hasAttachment),
                        
                        // Approval Tracking
                        submittedDate: fields.submittedDate || '',
                        lastUpdated: fields.lastUpdated || '',
                        subApprovedBy: fields.subApprovedBy || '',
                        subApprovedDate: fields.subApprovedDate || '',
                        approvedBy: fields.approvedBy || '',
                        approvalDate: fields.approvalDate || '',
                        paidBy: fields.paidBy || '',
                        paymentDate: fields.paymentDate || '',
                        rejectionReason: fields.rejectionReason || '',
                        
                        source: 'airtable'
                    };
                }) || [];
            } else {
                console.error('❌ Failed to fetch:', response.status);
                return [];
            }
        } catch (error) {
            console.error('❌ Error fetching from Airtable:', error);
            return [];
        }
    },

// UPDATE EXPENSE
updateExpense: async function(recordId, updateData) {
    try {
        console.log('🔵 UPDATE EXPENSE CALLED');
        
        if (!recordId) {
            return { success: false, error: 'Record ID is required' };
        }
        
        const id = String(recordId);
        
        if (!id.startsWith('rec')) {
            return { success: false, error: 'Invalid record ID format - must start with "rec"' };
        }
        
        // FIELD MAPPING - camelCase sesuai Airtable
        const fieldMapping = {
            'employeeName': 'employeeName',
            'name': 'employeeName',
            'division': 'division',
            'manager': 'manager',
            'date': 'expenseDate',
            'expenseDate': 'expenseDate',
            'type': 'expenseType',
            'expenseType': 'expenseType',
            'category': 'category',
            'project': 'project',
            'description': 'description',
            'amount': 'amount',
            'paymentMethod': 'paymentMethod',
            'urgency': 'urgency',
            'status': 'status',
            'paymentStatus': 'paymentStatus',
            'hasAttachment': 'hasAttachment',
            'submittedDate': 'submittedDate',
            'lastUpdated': 'lastUpdated',
            'subApprovedBy': 'subApprovedBy',
            'subApprovedDate': 'subApprovedDate',
            'approvedBy': 'approvedBy',
            'approvalDate': 'approvalDate',
            'paidBy': 'paidBy',
            'paymentDate': 'paymentDate',
            'rejectionReason': 'rejectionReason'
        };
        
        const cleanData = {};
        
        Object.keys(updateData).forEach(key => {
            const airtableField = fieldMapping[key] || key;
            let value = updateData[key];
            
            if (value === undefined || value === null || value === '') return;
            
            // Format berdasarkan tipe field
            if (key === 'amount' || key === 'Amount') {
                cleanData[airtableField] = Number(value);
            } 
            else if (key === 'hasAttachment' || key === 'HasAttachment') {
                cleanData[airtableField] = Boolean(value);
            } 
            // Untuk semua field tanggal, kirim dalam format YYYY-MM-DD saja
            else if (key.includes('Date') || key.includes('date') || airtableField.includes('Date') || airtableField.includes('date')) {
                // Ambil hanya bagian YYYY-MM-DD
                if (value && typeof value === 'string') {
                    cleanData[airtableField] = value.split('T')[0];
                } else {
                    cleanData[airtableField] = value;
                }
            } 
            else {
                cleanData[airtableField] = String(value);
            }
        });
        
        console.log('📤 Cleaned data for Airtable:', cleanData);
        
        if (Object.keys(cleanData).length === 0) {
            return { success: false, error: 'No valid fields to update' };
        }
        
        const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}/${id}`;
        
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fields: cleanData })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Update successful');
            return { success: true, data: result };
        } else {
            const errorText = await response.text();
            console.error('❌ Update failed:', errorText);
            return { success: false, error: 'Update failed' };
        }
    } catch (error) {
        console.error('❌ Update error:', error);
        return { success: false, error: error.message };
    }
},

// Buat expense baru
createExpense: async function(expenseData) {
    try {
        console.log('📝 Creating expense with data:', expenseData);
        
        // Format tanggal dengan benar (YYYY-MM-DD saja)
        const formatDate = (dateString) => {
            if (!dateString) return new Date().toISOString().split('T')[0];
            return dateString.split('T')[0];
        };
        
        // Mapping category ke nilai yang valid di Airtable
        const validCategories = {
            'travel': 'travel',
            'meals': 'meals',
            'office-supplies': 'office-supplies',
            'software': 'software',
            'training': 'training',
            'marketing': 'marketing',
            'utilities': 'utilities',
            'other': 'other',
            'hardware': 'other', // Map hardware ke other
            'hardware & equipment': 'other',
            'hardware&equipment': 'other'
        };
        
        const categoryInput = String(expenseData.category || 'other').toLowerCase();
        const mappedCategory = validCategories[categoryInput] || 'other';
        
        console.log(`📊 Category mapping: "${categoryInput}" -> "${mappedCategory}"`);
        
        // MENGGUNAKAN FIELD NAMES camelCase SESUAI AIRTABLE
        const cleanData = {
            "employeeName": String(expenseData.employeeName || expenseData.name || 'Unknown'),
            "division": String(expenseData.division || 'Unknown'),
            "manager": String(expenseData.manager || 'Unknown'),
            "expenseDate": formatDate(expenseData.expenseDate || expenseData.date),
            "expenseType": String(expenseData.expenseType || expenseData.type || 'reimbursement'),
            "category": mappedCategory, // Gunakan hasil mapping
            "project": String(expenseData.project || 'No Project'),
            "description": String(expenseData.description || ''),
            "amount": Number(expenseData.amount) || 0,
            "paymentMethod": String(expenseData.paymentMethod || 'bank-transfer'),
            "urgency": String(expenseData.urgency || 'normal'),
            "status": String(expenseData.status || 'pending'),
            "paymentStatus": String(expenseData.paymentStatus || 'pending'),
            "hasAttachment": Boolean(expenseData.hasAttachment),
            "submittedDate": formatDate(expenseData.submittedDate || new Date().toISOString()),
            "lastUpdated": formatDate(new Date().toISOString())
        };
        
        // Hapus field yang kosong
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] === undefined || cleanData[key] === null || cleanData[key] === '') {
                delete cleanData[key];
            }
        });
        
        console.log('📤 FINAL DATA TO SEND:', JSON.stringify(cleanData, null, 2));
        
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields: cleanData })
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ CREATE SUCCESS:', data.id);
            
            // Simpan juga ke localStorage sebagai backup
            try {
                const localData = JSON.parse(localStorage.getItem('expenseSubmissions') || '[]');
                localData.push({
                    ...expenseData,
                    airtableId: data.id,
                    syncedToAirtable: true,
                    lastSync: new Date().toISOString()
                });
                localStorage.setItem('expenseSubmissions', JSON.stringify(localData));
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
            }
            
            return { success: true, recordId: data.id };
        } else {
            const errorText = await response.text();
            console.error('❌ CREATE FAILED:', errorText);
            
            // Parse error untuk informasi lebih detail
            try {
                const errorJson = JSON.parse(errorText);
                console.error('Error details:', errorJson);
            } catch (e) {}
            
            // Fallback ke localStorage
            try {
                const localData = JSON.parse(localStorage.getItem('expenseSubmissions') || '[]');
                localData.push({
                    ...expenseData,
                    id: `local-${Date.now()}`,
                    syncedToAirtable: false,
                    lastSync: new Date().toISOString()
                });
                localStorage.setItem('expenseSubmissions', JSON.stringify(localData));
                console.log('✅ Saved to localStorage as fallback');
            } catch (e) {
                console.error('Failed to save to localStorage:', e);
            }
            
            return { success: false, error: 'Create failed', fallback: true };
        }
    } catch (error) {
        console.error('❌ CREATE ERROR:', error);
        
        // Fallback ke localStorage
        try {
            const localData = JSON.parse(localStorage.getItem('expenseSubmissions') || '[]');
            localData.push({
                ...expenseData,
                id: `local-${Date.now()}`,
                syncedToAirtable: false,
                lastSync: new Date().toISOString()
            });
            localStorage.setItem('expenseSubmissions', JSON.stringify(localData));
            console.log('✅ Saved to localStorage as fallback after error');
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
        
        return { success: false, error: error.message, fallback: true };
    }
},

    // Sinkronisasi dua arah
    syncTwoWay: async function() {
        try {
            console.log('🔄 Starting two-way sync...');
            
            const airtableData = await this.getAllExpenses();
            console.log(`✅ Got ${airtableData.length} from Airtable`);
            
            let localData = [];
            try {
                localData = JSON.parse(localStorage.getItem('expenseSubmissions') || '[]');
                console.log(`📁 Found ${localData.length} in localStorage`);
            } catch (e) {
                console.error('Error reading localStorage:', e);
            }
            
            const airtableIds = new Set(airtableData.map(item => item.airtableId));
            const mergedData = [...airtableData];
            
            for (const localItem of localData) {
                if (!airtableIds.has(localItem.airtableId) && !localItem.airtableId?.startsWith('local')) {
                    mergedData.push(localItem);
                }
            }
            
            localStorage.setItem('expenseSubmissions', JSON.stringify(mergedData));
            
            console.log(`✅ Sync complete: ${mergedData.length} total items`);
            return mergedData;
        } catch (error) {
            console.error('❌ Sync failed:', error);
            return [];
        }
    },

    // Sinkronisasi lokal ke Airtable
    syncLocalToAirtable: async function() {
        try {
            const localData = JSON.parse(localStorage.getItem('expenseSubmissions') || '[]');
            console.log(`🔄 Syncing ${localData.length} items to Airtable...`);
            
            let successCount = 0;
            let failCount = 0;
            
            for (let i = 0; i < localData.length; i++) {
                const item = localData[i];
                
                if (item.airtableId && item.airtableId.startsWith('rec') && item.syncedToAirtable) {
                    console.log(`⏭️ Item ${item.project} already synced: ${item.airtableId}`);
                    continue;
                }
                
                console.log(`📤 Uploading item ${i+1}/${localData.length}: ${item.project}`);
                
                const cleanItem = {
                    employeeName: item.employeeName || item.name,
                    division: item.division,
                    manager: item.manager,
                    expenseDate: item.expenseDate || item.date,
                    expenseType: item.expenseType || item.type || 'reimbursement',
                    category: item.category || 'other',
                    project: item.project,
                    description: item.description || '',
                    amount: Number(item.amount) || 0,
                    paymentMethod: item.paymentMethod || 'bank-transfer',
                    urgency: item.urgency || 'normal',
                    status: item.status || 'pending',
                    paymentStatus: item.paymentStatus || 'pending',
                    hasAttachment: Boolean(item.hasAttachment),
                    submittedDate: item.submittedDate || new Date().toISOString().split('T')[0]
                };
                
                const result = await this.createExpense(cleanItem);
                
                if (result.success) {
                    localData[i].airtableId = result.recordId;
                    localData[i].syncedToAirtable = true;
                    localData[i].lastSync = new Date().toISOString();
                    successCount++;
                    console.log(`✅ Uploaded: ${item.project} -> ${result.recordId}`);
                } else {
                    failCount++;
                    console.log(`❌ Failed: ${item.project}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            localStorage.setItem('expenseSubmissions', JSON.stringify(localData));
            
            console.log(`📊 Sync complete: ✅ ${successCount} success, ❌ ${failCount} failed`);
            
            return { success: true, synced: successCount, failed: failCount };
        } catch (error) {
            console.error('❌ Sync error:', error);
            return { success: false, error: error.message };
        }
    },

    // Ambil data konsolidasi
    getConsolidatedData: async function() {
        try {
            try {
                const airtableData = await this.getAllExpenses();
                if (airtableData.length > 0) {
                    return airtableData;
                }
            } catch (e) {
                console.warn('⚠️ Failed to get Airtable data:', e.message);
            }
            
            const localData = JSON.parse(localStorage.getItem('expenseSubmissions') || '[]');
            console.log(`📁 Using ${localData.length} items from localStorage`);
            
            return localData.map(item => ({
                ...item,
                id: item.airtableId || item.id || `local-${Date.now()}`,
                source: 'local'
            }));
        } catch (error) {
            console.error('❌ Error getting consolidated data:', error);
            return [];
        }
    }
};

// Auto-test koneksi
setTimeout(() => {
    if (window.airtableService) {
        window.airtableService.testConnection().then(result => {
            console.log('Initial connection test:', result);
        });
    }
}, 1000);
