// api.js - UPDATE DENGAN DOMAIN BARU
const API_BASE_URL = 'https://expense-system-test8.pages.dev';

const apiService = {
    // Test koneksi
    async testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/test`);
            return await response.json();
        } catch (error) {
            console.error('Connection error:', error);
            return { success: false };
        }
    },

    // Ambil semua expenses
    async getAllExpenses() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`);
            const data = await response.json();
            
            // Pastikan data yang dikembalikan adalah array
            if (Array.isArray(data)) {
                return data;
            } else if (data.records) {
                return data.records;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return [];
        }
    },

    // Get expenses by employee email
    async getMyExpenses(email) {
        try {
            const allExpenses = await this.getAllExpenses();
            return allExpenses.filter(expense => {
                const fields = expense.fields || expense;
                return fields.employeeEmail === email;
            });
        } catch (error) {
            console.error('Error getting my expenses:', error);
            return [];
        }
    },

    // Get expenses by manager (untuk manager melihat timnya)
    async getTeamExpenses(managerEmail) {
        try {
            const allExpenses = await this.getAllExpenses();
            return allExpenses.filter(expense => {
                const fields = expense.fields || expense;
                return fields.manager === managerEmail;
            });
        } catch (error) {
            console.error('Error getting team expenses:', error);
            return [];
        }
    },

    // Get pending approvals (untuk manager)
    async getPendingApprovals(managerEmail) {
        try {
            const allExpenses = await this.getAllExpenses();
            return allExpenses.filter(expense => {
                const fields = expense.fields || expense;
                return fields.manager === managerEmail && 
                       fields.status === 'pending';
            });
        } catch (error) {
            console.error('Error getting pending approvals:', error);
            return [];
        }
    },

    // Get ready for payment (untuk finance)
    async getReadyForPayment() {
        try {
            const allExpenses = await this.getAllExpenses();
            return allExpenses.filter(expense => {
                const fields = expense.fields || expense;
                return fields.status === 'approved' && 
                       fields.paymentStatus !== 'paid';
            });
        } catch (error) {
            console.error('Error getting ready for payment:', error);
            return [];
        }
    },

    // Buat expense baru
    async createExpense(expenseData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error creating expense:', error);
            return { success: false, error: error.message };
        }
    },

    // Update expense
    async updateExpense(id, updateData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/expenses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error updating expense:', error);
            return { success: false, error: error.message };
        }
    }
};

// ========== FUNGSI AUTHENTICATION ==========

// Login user
async function login(email, password) {
    try {
        console.log('Mencoba login dengan email:', email);
        
        // Panggil endpoint login
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Simpan user di session
            sessionStorage.setItem('user', JSON.stringify(result.user));
            return { success: true, user: result.user };
        } else {
            return { success: false, message: result.error || 'Login gagal' };
        }
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Koneksi error: ' + error.message };
    }
}

// Get user by email
async function getUserByEmail(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(email)}`);
        
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            id: data.id,
            email: data.fields.email,
            name: data.fields.name,
            role: data.fields.role,
            division: data.fields.division,
            manager: data.fields.manager || null
        };
        
    } catch (error) {
        console.error('Error getting user by email:', error);
        return null;
    }
}

// Get team members for manager
async function getTeamMembers(managerEmail) {
    try {
        // Ambil semua users dulu
        const response = await fetch(`${API_BASE_URL}/api/users`);
        const users = await response.json();
        
        // Filter yang manager-nya cocok
        return users
            .filter(u => u.fields.managerEmail === managerEmail)
            .map(u => ({
                email: u.fields.email,
                name: u.fields.name,
                division: u.fields.division
            }));
            
    } catch (error) {
        console.error('Error getting team members:', error);
        return [];
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Check auth - untuk halaman yang perlu login
function checkAuth() {
    const user = sessionStorage.getItem('user');
    if (!user) {
        window.location.href = '/login.html';
        return null;
    }
    return JSON.parse(user);
}

// Check auth - untuk halaman yang bisa diakses tanpa login
function checkAuthOptional() {
    const user = sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Ganti password
async function changePassword(email, oldPassword, newPassword) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, oldPassword, newPassword })
        });
        
        return await response.json();
        
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: error.message };
    }
}

// Tambahkan fungsi ke apiService
apiService.login = login;
apiService.getUserByEmail = getUserByEmail;
apiService.getTeamMembers = getTeamMembers;
apiService.logout = logout;
apiService.checkAuth = checkAuth;
apiService.checkAuthOptional = checkAuthOptional;
apiService.changePassword = changePassword;

// Export
window.apiService = apiService;
window.airtableService = apiService;

console.log('✅ apiService dan airtableService tersedia');