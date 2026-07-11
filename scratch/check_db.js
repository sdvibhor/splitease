import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function check() {
    const db = await open({
        filename: path.join(__dirname, '..', 'server', 'database.sqlite'),
        driver: sqlite3.Database
    });

    console.log("--- EXPENSES ---");
    const expenses = await db.all("SELECT * FROM expenses ORDER BY id DESC LIMIT 5");
    console.log(expenses);

    console.log("--- SPLITS ---");
    const splits = await db.all("SELECT * FROM expense_splits ORDER BY id DESC LIMIT 5");
    console.log(splits);

    console.log("--- USERS ---");
    const users = await db.all("SELECT id, name, email FROM users");
    console.log(users);
}

check();
