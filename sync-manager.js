// sync-manager.js - VERSI DIPERBAIKI
window.SyncManager = {
    isOnline: navigator.onLine,
    
    init: function() {
        console.log('Sync Manager initialized');
        // Tunggu 1 detik untuk memastikan api.js sudah load
        setTimeout(() => {
            this.checkConnection();
        }, 1000);
    },
    
    checkConnection: async function() {
        // Cek apakah airtableService sudah tersedia
        if (window.airtableService && typeof window.airtableService.testConnection === 'function') {
            const result = await window.airtableService.testConnection();
            console.log('Connection status:', result && result.success ? 'Online' : 'Offline');
        } else {
            console.log('airtableService not available yet, will retry...');
            // Coba lagi setelah 2 detik
            setTimeout(() => this.checkConnection(), 2000);
        }
    },
    
    manualSync: async function() {
        if (window.airtableService && typeof window.airtableService.syncTwoWay === 'function') {
            await window.airtableService.syncTwoWay();
            alert('Sync completed');
            window.location.reload();
        } else {
            alert('Sync service not available. Please refresh the page.');
        }
    },
    
    getConnectionStatus: function() {
        return {
            isOnline: this.isOnline && window.airtableService ? true : false
        };
    }
};

// Inisialisasi setelah DOM siap
if (window.SyncManager) {
    // Tunggu sampai semua script load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.SyncManager.init());
    } else {
        window.SyncManager.init();
    }
}