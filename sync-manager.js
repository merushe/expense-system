// sync-manager.js - VERSI DENGAN INTEGRASI AIRTABLE
window.SyncManager = {
    isOnline: navigator.onLine,
    syncInProgress: false,
    
    init: function() {
        console.log('🔄 Sync Manager initialized');
        
        // Event listeners untuk status koneksi
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Event listener untuk sync antar tab
        window.addEventListener('storage', (event) => {
            if (event.key === 'sync-event') {
                console.log('🔄 Sync event detected from another tab');
                this.triggerSync();
            }
        });
        
        // Check if we can sync
        this.checkSyncCapability();
        
        // Cek koneksi awal
        this.checkInitialConnection();
    },
    
    checkSyncCapability: function() {
        if (window.airtableService) {
            console.log('✅ Airtable service available for sync');
        } else {
            console.warn('⚠️ Airtable service not available for sync');
        }
    },
    
    checkInitialConnection: async function() {
        if (window.airtableService) {
            const result = await window.airtableService.testConnection();
            this.isOnline = result.success;
            
            if (result.success) {
                console.log('✅ Connected to Airtable');
                this.showNotification('Connected to Airtable', 'success');
            } else {
                console.log('📴 Using offline mode');
                this.showNotification('Offline mode - Using local storage', 'warning');
            }
        }
    },
    
    handleOnline: function() {
        console.log('🌐 Network is online');
        this.isOnline = true;
        
        this.showNotification('Online - Ready to sync', 'success');
        
        // Sync setelah online
        setTimeout(() => {
            this.triggerSync();
        }, 2000);
    },
    
    handleOffline: function() {
        console.log('📴 Network is offline');
        this.isOnline = false;
        this.showNotification('Offline - Using local storage', 'warning');
    },
    
    showNotification: function(message, type) {
        try {
            // Cek apakah sudah ada notifikasi
            const existing = document.getElementById('sync-notification');
            if (existing) existing.remove();
            
            // Buat notifikasi
            const notification = document.createElement('div');
            notification.id = 'sync-notification';
            notification.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
            notification.style.zIndex = '9999';
            notification.style.maxWidth = '300px';
            notification.innerHTML = `
                <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            
            document.body.appendChild(notification);
            
            // Hapus otomatis setelah 3 detik
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    },
    
    async triggerSync() {
        // Cek apakah sedang dalam proses update manual
        if (window._updatingExpense || window._updatingPayment) {
            console.log('⏳ Manual update in progress, skipping auto-sync');
            return;
        }
        
        if (this.syncInProgress || !this.isOnline) {
            console.log('⏳ Sync already in progress or offline');
            return;
        }
        
        if (!window.airtableService) {
            console.warn('⚠️ Cannot sync: Airtable service not available');
            return;
        }
        
        this.syncInProgress = true;
        
        try {
            console.log('🔄 Starting automatic sync...');
            
            // Gunakan two-way sync
            if (window.airtableService.syncTwoWay) {
                const result = await window.airtableService.syncTwoWay();
                console.log('✅ Automatic sync completed:', result.length, 'items');
                
                // Notify other tabs
                localStorage.setItem('sync-event', Date.now().toString());
                
                // Notifikasi hanya jika ada perubahan
                if (result.length > 0) {
                    this.showNotification(`Synced ${result.length} items`, 'success');
                }
            } else {
                console.warn('⚠️ syncTwoWay not available');
            }
        } catch (error) {
            console.error('❌ Automatic sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    },
    
    // Fungsi untuk sinkronisasi manual
    async manualSync() {
        if (!this.isOnline) {
            alert('You are offline. Cannot sync to Airtable.');
            return;
        }
        
        if (!window.airtableService) {
            alert('Airtable service not available');
            return;
        }
        
        try {
            this.showNotification('Syncing...', 'info');
            
            if (window.airtableService.syncTwoWay) {
                const result = await window.airtableService.syncTwoWay();
                
                let message = `✅ Sync completed!\n\nTotal items: ${result.length}`;
                
                // Hitung dari Airtable vs local
                const airtableCount = result.filter(item => item.source === 'airtable').length;
                const localCount = result.filter(item => item.source === 'local').length;
                
                if (airtableCount > 0) {
                    message += `\nFrom Airtable: ${airtableCount}`;
                }
                if (localCount > 0) {
                    message += `\nFrom Local: ${localCount}`;
                }
                
                alert(message);
                
                // Reload page jika diperlukan
                if (window.location.pathname.includes('Dashboard') || 
                    window.location.pathname.includes('Approval') ||
                    window.location.pathname.includes('Payment')) {
                    window.location.reload();
                }
            } else if (window.airtableService.syncLocalToAirtable) {
                const result = await window.airtableService.syncLocalToAirtable();
                alert(`✅ Sync completed!\n\nSynced to Airtable: ${result.synced} items\nFailed: ${result.failed} items`);
                
                if (result.synced > 0 && window.location.pathname.includes('Dashboard')) {
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('❌ Manual sync failed:', error);
            alert('❌ Sync failed: ' + error.message);
        }
    },
    
// Fungsi untuk mendapatkan status koneksi
getConnectionStatus: function() {
    return {
        isOnline: this.isOnline,
        serviceAvailable: !!window.airtableService
    };
},

// Inisialisasi
try {
    window.SyncManager.init();
} catch (error) {
    console.error('Failed to initialize SyncManager:', error);
}