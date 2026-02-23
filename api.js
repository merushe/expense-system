// api.js - CLIENT-SIDE VERSION (memanggil serverless function)
const API_BASE_URL = '/api/expenses';

window.airtableService = {
    // Test koneksi
    testConnection: async function() {
        try {
            console.log('Testing connection...');
            const response = await fetch(API_BASE_URL);
            if (response.ok) {
                console.log('✅ Connection successful');
                return { success: true };
            } else {
                console.error('❌ Connection failed:', response.status);
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            console.error('❌ Connection error:', error);
            return { success: false, error: error.message };
        }
    },

    // Ambil semua expenses
getAllExpenses: async function() {
    try {
        console.log('Fetching from API:', API_BASE_URL);
        const response = await fetch(API_BASE_URL);
        
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data type:', Array.isArray(data) ? 'array' : typeof data);
        console.log('Response data:', data);
        
        if (Array.isArray(data)) {
            console.log(`✅ Got ${data.length} records`);
            return data;
        } else {
            console.error('❌ Data is not array:', data);
            return [];
        }
    } catch (error) {
        console.error('❌ Error fetching:', error);
        return [];
    }
},
    
// Buat expense baru
    createExpense: async function(expenseData) {
        try {
            console.log('Creating expense:', expenseData);
            
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Create success:', result);
                return { success: true, recordId: result.recordId };
            } else {
                const error = await response.text();
                console.error('❌ Create failed:', error);
                return { success: false, error: 'Create failed' };
            }
        } catch (error) {
            console.error('❌ Create error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update expense
    updateExpense: async function(recordId, updateData) {
        try {
            const response = await fetch(`${API_BASE_URL}/${recordId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Update success');
                return { success: true, data: result };
            } else {
                console.error('❌ Update failed:', response.status);
                return { success: false, error: 'Update failed' };
            }
        } catch (error) {
            console.error('❌ Update error:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete expense
    deleteExpense: async function(recordId) {
        try {
            const response = await fetch(`${API_BASE_URL}/${recordId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('✅ Delete success');
                return { success: true };
            } else {
                console.error('❌ Delete failed:', response.status);
                return { success: false, error: 'Delete failed' };
            }
        } catch (error) {
            console.error('❌ Delete error:', error);
            return { success: false, error: error.message };
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
