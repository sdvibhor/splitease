# 💸 SplitEase

SplitEase is a full-stack expense sharing and personal finance management application that simplifies tracking expenses with friends and managing day-to-day spending. It combines secure authentication, intelligent bill splitting, receipt scanning using OCR, interactive analytics, and social collaboration into a single platform.

---

## ✨ Features

- 🔐 Secure user authentication with JWT
- 💰 Split expenses equally among friends or groups
- 👥 Create and manage expense groups
- 📊 Interactive dashboard with balance summaries
- 📈 Spending analytics and category-wise insights
- 📷 OCR-based receipt scanning using Tesseract.js
- 🏆 Leaderboard showing spending and settlement statistics
- 💬 Comments and emoji reactions on shared expenses
- 📱 Responsive and modern user interface

---

## 🛠 Tech Stack

### Frontend
- React
- Vite
- Vanilla CSS
- Framer Motion
- Lucide React

### Backend
- Node.js
- Express.js

### Database
- SQLite

### Authentication
- JWT
- bcryptjs

### OCR
- Tesseract.js

---

## 📂 Project Structure

```
SplitEase
├── public/
├── server/
│   ├── db.js
│   ├── index.js
│   └── database.sqlite
├── src/
│   ├── components/
│   ├── App.jsx
│   └── ...
├── package.json
├── vite.config.js
└── README.md
```

---

## ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/your-username/SplitEase.git
```

Move into the project directory

```bash
cd SplitEase
```

Install dependencies

```bash
npm install
```

---

## ▶️ Running the Application

Start the backend server

```bash
cd server
npm install
npm start
```

In another terminal, start the frontend

```bash
npm run dev
```

Visit

```
http://localhost:5173
```

---

## 🗄 Database

SplitEase uses **SQLite**, a lightweight serverless database.

All application data—including users, expenses, groups, and settlements—is stored in a single database file:

```
server/database.sqlite
```

Since SQLite is file-based, the project can be shared easily without installing a separate database server.

---

## 📊 Core Functionalities

- Secure authentication with encrypted passwords
- Automatic expense splitting between multiple users
- Group-based expense management
- Real-time balance calculations
- Expense history and transaction tracking
- Interactive spending analytics
- OCR-powered receipt scanning
- Social interactions through comments and reactions

---

## 👨‍💻 Author

**Vibhor**

B.Tech Computer Science Engineering

---

## 📄 License

This project is intended for educational and portfolio purposes.