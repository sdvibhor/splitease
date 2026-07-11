import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function test() {
    try {
        console.log("--- SIGNUP ---");
        const signupRes = await axios.post(`${API_BASE}/auth/signup`, {
            name: "Test User",
            email: "test_" + Date.now() + "@example.com",
            password: "password"
        });
        console.log("Signup success:", signupRes.data);

        console.log("--- LOGIN ---");
        const loginRes = await axios.post(`${API_BASE}/auth/login`, {
            email: signupRes.data.email,
            password: "password"
        });
        const token = loginRes.data.token;
        const user = loginRes.data.user;
        console.log("Login success, token received");

        console.log("--- ADD EXPENSE (Split with everyone) ---");
        // Get all users
        const usersRes = await axios.get(`${API_BASE}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const allUserIds = usersRes.data.map(u => u.id);
        
        // My share should be auto-included by the logic I fixed
        const expenseRes = await axios.post(`${API_BASE}/expenses`, {
            description: "Test Team Dinner",
            amount: 300,
            category: "Food",
            splitWith: allUserIds // This includes everyone
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Expense added:", expenseRes.data);

        console.log("--- VERIFY EXPENSES ---");
        const expensesRes = await axios.get(`${API_BASE}/expenses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const lastExpense = expensesRes.data[0];
        console.log("Last Expense Description:", lastExpense.description);
        console.log("Last Expense Amount:", lastExpense.amount);
        console.log("Splits Count:", lastExpense.splits.length);
        
        // If there were 4 users total (3 existing + 1 new), splits.length should be 3 (everyone else)
        console.log("Splits detail:", lastExpense.splits.map(s => `${s.user_name} owes ${s.amount_owed}`));

    } catch (err) {
        console.error("Test failed:", err.response?.data || err.message);
    }
}

test();
