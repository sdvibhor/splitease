import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDb } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'splitease_secret_key_123';

app.use(cors());
app.use(express.json());
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

let db;

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        res.status(201).json({ id: result.lastID, name, email });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET_KEY);
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// User Search (for splitting)
app.get('/api/users', authenticateToken, async (req, res) => {
    const users = await db.all('SELECT id, name, email FROM users');
    res.json(users);
});

// Expense Routes
app.post('/api/expenses', authenticateToken, async (req, res) => {
    const { description, amount, splitWith, groupId, category } = req.body;
    const payerId = req.user.id;
    console.log('Adding expense:', { description, amount, splitWith, payerId });

    try {
        const result = await db.run(
            'INSERT INTO expenses (description, amount, payer_id, group_id, category) VALUES (?, ?, ?, ?, ?)',
            [description, amount, payerId, groupId || null, category || 'General']
        );
        const expenseId = result.lastID;

        const totalPeople = splitWith.length;
        const splitAmount = amount / totalPeople;

        for (const userId of splitWith) {
            // Compare as numbers to avoid type mismatch
            if (Number(userId) !== Number(payerId)) {
                await db.run(
                    'INSERT INTO expense_splits (expense_id, user_id, amount_owed) VALUES (?, ?, ?)',
                    [expenseId, userId, splitAmount]
                );
            }
        }

        res.status(201).json({ id: expenseId, message: 'Expense added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/expenses', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const expenses = await db.all(`
            SELECT DISTINCT e.*, u.name as payer_name 
            FROM expenses e 
            JOIN users u ON e.payer_id = u.id
            LEFT JOIN expense_splits es ON e.id = es.expense_id
            LEFT JOIN group_members gm ON e.group_id = gm.group_id
            WHERE e.payer_id = ? 
               OR es.user_id = ? 
               OR gm.user_id = ?
            ORDER BY e.created_at DESC
            LIMIT 30
        `, [userId, userId, userId]);

        // For each expense, get the splits
        for (let exp of expenses) {
            const splits = await db.all(`
                SELECT es.*, u.name as user_name 
                FROM expense_splits es 
                JOIN users u ON es.user_id = u.id 
                WHERE es.expense_id = ?
            `, [exp.id]);
            exp.splits = splits;
        }

        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Social Features: Comments
app.post('/api/expenses/:id/comments', authenticateToken, async (req, res) => {
    const { comment } = req.body;
    const expenseId = req.params.id;
    const userId = req.user.id;

    try {
        await db.run(
            'INSERT INTO expense_comments (expense_id, user_id, comment) VALUES (?, ?, ?)',
            [expenseId, userId, comment]
        );
        res.status(201).json({ message: 'Comment added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/expenses/:id/comments', authenticateToken, async (req, res) => {
    const comments = await db.all(`
        SELECT c.*, u.name as user_name 
        FROM expense_comments c 
        JOIN users u ON c.user_id = u.id 
        WHERE c.expense_id = ?
        ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(comments);
});

// Social Features: Reactions
app.post('/api/expenses/:id/reactions', authenticateToken, async (req, res) => {
    const { emoji } = req.body;
    const expenseId = req.params.id;
    const userId = req.user.id;

    try {
        await db.run(
            'INSERT INTO expense_reactions (expense_id, user_id, emoji) VALUES (?, ?, ?)',
            [expenseId, userId, emoji]
        );
        res.status(201).json({ message: 'Reaction added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/expenses/:id/reactions', authenticateToken, async (req, res) => {
    const reactions = await db.all(`
        SELECT emoji, COUNT(*) as count 
        FROM expense_reactions 
        WHERE expense_id = ? 
        GROUP BY emoji
    `, [req.params.id]);
    res.json(reactions);
});

// Groups Routes
app.post('/api/groups', authenticateToken, async (req, res) => {
    const { name, members } = req.body; // members is array of emails/IDs
    const creatorId = req.user.id;

    try {
        const result = await db.run('INSERT INTO groups (name, created_by) VALUES (?, ?)', [name, creatorId]);
        const groupId = result.lastID;

        // Add creator as member
        await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, creatorId]);

        // Add other members
        for (const userId of members) {
            if (userId !== creatorId) {
                await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);
            }
        }

        res.status(201).json({ id: groupId, name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/groups', authenticateToken, async (req, res) => {
    const groups = await db.all(`
        SELECT g.*, (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = ?
    `, [req.user.id]);
    res.json(groups);
});

app.put('/api/groups/:id', authenticateToken, async (req, res) => {
    const { name, members } = req.body;
    const groupId = req.params.id;
    const userId = req.user.id;

    try {
        // Check if user is the creator
        const group = await db.get('SELECT created_by FROM groups WHERE id = ?', [groupId]);
        if (!group || Number(group.created_by) !== Number(userId)) {
            return res.status(403).json({ error: 'Only the creator can edit this group' });
        }

        await db.run('UPDATE groups SET name = ? WHERE id = ?', [name, groupId]);

        // Sync members: Delete all and re-add
        await db.run('DELETE FROM group_members WHERE group_id = ?', [groupId]);
        
        // Add creator back
        await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, userId]);

        // Add others
        for (const mId of members) {
            if (Number(mId) !== Number(userId)) {
                await db.run('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [groupId, Number(mId)]);
            }
        }

        res.json({ message: 'Group updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/groups/:id/members', authenticateToken, async (req, res) => {
    try {
        const members = await db.all(`
            SELECT u.id, u.name, u.email 
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            WHERE gm.group_id = ?
        `, [req.params.id]);
        res.json(members);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Users Route
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await db.all('SELECT id, name, email FROM users WHERE id != ?', [req.user.id]);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Leaderboard
app.get('/api/leaderboard', authenticateToken, async (req, res) => {
    const { groupId } = req.query;
    let queryParams = [];
    let groupFilter = '';

    if (groupId) {
        groupFilter = 'WHERE group_id = ?';
        queryParams.push(groupId);
    }

    // Biggest Spenders
    const spenders = await db.all(`
        SELECT u.name, SUM(e.amount) as total_spent
        FROM expenses e
        JOIN users u ON e.payer_id = u.id
        ${groupFilter}
        GROUP BY u.id, u.name
        ORDER BY total_spent DESC
        LIMIT 5
    `, queryParams);

    // Who owes most
    const debtors = await db.all(`
        SELECT u.name, SUM(es.amount_owed) as total_owed
        FROM expense_splits es
        JOIN users u ON es.user_id = u.id
        JOIN expenses e ON es.expense_id = e.id
        ${groupId ? 'WHERE e.group_id = ? AND es.is_paid = 0' : 'WHERE es.is_paid = 0'}
        GROUP BY u.id, u.name
        ORDER BY total_owed DESC
        LIMIT 5
    `, queryParams);

    // Fastest Settlers (average time to settle)
    const settlers = await db.all(`
        SELECT u.name, AVG(julianday(s.settled_at) - julianday(e.created_at)) * 24 * 60 as avg_minutes
        FROM settlements s
        JOIN users u ON s.payer_id = u.id
        JOIN expense_splits es ON es.user_id = s.payer_id
        JOIN expenses e ON es.expense_id = e.id
        WHERE es.is_paid = 1 AND s.payee_id = e.payer_id
        GROUP BY u.id, u.name
        ORDER BY avg_minutes ASC
        LIMIT 5
    `);

    res.json({ spenders, debtors, settlers });
});

// Advanced Analytics
app.get('/api/analytics', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    // Personal Share Spending Trends
    const trends = await db.all(`
        SELECT date, SUM(personal_amount) as total
        FROM (
            -- Expenses I paid (my share = total amount - sum of splits for others)
            SELECT strftime('%Y-%m-%d', e.created_at) as date, 
                   (e.amount - COALESCE((SELECT SUM(amount_owed) FROM expense_splits WHERE expense_id = e.id), 0)) as personal_amount
            FROM expenses e
            WHERE e.payer_id = ?
            
            UNION ALL
            
            -- Expenses I owe others (my share = split amount)
            SELECT strftime('%Y-%m-%d', e.created_at) as date,
                   es.amount_owed as personal_amount
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            WHERE es.user_id = ?
        )
        GROUP BY date
        ORDER BY date ASC
        LIMIT 30
    `, [userId, userId]);

    // Personal Category Breakdown
    const categories = await db.all(`
        SELECT category, SUM(personal_amount) as total
        FROM (
            SELECT category, (amount - COALESCE((SELECT SUM(amount_owed) FROM expense_splits WHERE expense_id = id), 0)) as personal_amount
            FROM expenses
            WHERE payer_id = ?
            
            UNION ALL
            
            SELECT e.category, es.amount_owed as personal_amount
            FROM expense_splits es
            JOIN expenses e ON es.expense_id = e.id
            WHERE es.user_id = ?
        )
        GROUP BY category
    `, [userId, userId]);

    // Budget Comparison (using personal share)
    const budgets = await db.all(`
        SELECT b.*, (
            SELECT SUM(personal_amount)
            FROM (
                SELECT e.category, (e.amount - COALESCE((SELECT SUM(amount_owed) FROM expense_splits WHERE expense_id = e.id), 0)) as personal_amount
                FROM expenses e
                WHERE e.payer_id = b.user_id AND e.category = b.category
                
                UNION ALL
                
                SELECT e.category, es.amount_owed as personal_amount
                FROM expense_splits es
                JOIN expenses e ON es.expense_id = e.id
                WHERE es.user_id = b.user_id AND e.category = b.category
            )
        ) as spent
        FROM budgets b
        WHERE b.user_id = ?
    `, [userId]);

    res.json({ trends, categories, budgets });
});

// Summary Route - Who owes whom
app.get('/api/summary', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    // People who owe ME
    const oweMe = await db.all(`
        SELECT u.name, u.email, u.id as user_id, SUM(es.amount_owed) as total
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        JOIN users u ON es.user_id = u.id
        WHERE e.payer_id = ? AND es.is_paid = 0
        GROUP BY es.user_id
    `, [userId]);

    // People I owe
    const IOwe = await db.all(`
        SELECT u.name, u.email, u.id as user_id, SUM(es.amount_owed) as total
        FROM expense_splits es
        JOIN expenses e ON es.expense_id = e.id
        JOIN users u ON e.payer_id = u.id
        WHERE es.user_id = ? AND es.is_paid = 0
        GROUP BY e.payer_id
    `, [userId]);

    res.json({ oweMe, IOwe });
});

// Settle Up Route
app.post('/api/settle', authenticateToken, async (req, res) => {
    const { payeeId, amount } = req.body; 
    const payerId = req.user.id;
    console.log('Settling up:', { payerId, payeeId, amount });

    try {
        const result = await db.run(`
            UPDATE expense_splits
            SET is_paid = 1
            WHERE user_id = ? AND expense_id IN (
                SELECT id FROM expenses WHERE payer_id = ?
            )
        `, [Number(payerId), Number(payeeId)]);

        await db.run(
            'INSERT INTO settlements (payer_id, payee_id, amount) VALUES (?, ?, ?)',
            [Number(payerId), Number(payeeId), Number(amount)]
        );

        res.json({ message: 'Settled up successfully', updatedRows: result.changes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Settlement History
app.get('/api/history', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const history = await db.all(`
        SELECT s.*, u1.name as payer_name, u2.name as payee_name
        FROM settlements s
        JOIN users u1 ON s.payer_id = u1.id
        JOIN users u2 ON s.payee_id = u2.id
        WHERE s.payer_id = ? OR s.payee_id = ?
        ORDER BY s.settled_at DESC
    `, [userId, userId]);
    res.json(history);
});

async function start() {
    db = await initDb();
    
    // Handle SPA routing
    app.get('*path', (req, res) => {
        const indexPath = path.join(__dirname, '../dist/index.html');
        // Only send if it exists to avoid crashing on missing build
        res.sendFile(indexPath, (err) => {
            if (err) {
                res.status(200).send('API is running. (Build the frontend with "npm run build" to see the UI here)');
            }
        });
    });

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start();
