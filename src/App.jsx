import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PlusCircle,
  History,
  Wallet,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownLeft,
  LogOut,
  Send,
  CheckCircle,
  XCircle,
  LayoutDashboard,
  BarChart2,
  Trophy,
  Users,
  RefreshCw,
  Edit,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// New Components
import Analytics from './components/Analytics';
import SocialFeatures from './components/SocialFeatures';
import Leaderboard from './components/Leaderboard';
import OCR from './components/OCR';

const API_BASE = window.location.origin.includes('localhost') ? 'http://localhost:5000/api' : '/api';


function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('dashboard'); // dashboard, add, history, auth, analytics, leaderboard
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      setUser(savedUser);
      if (view === 'auth') setView('dashboard');
    } else {
      setView('auth');
    }
    setLoading(false);
  }, [token]);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setUser(userData);
    setView('dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('auth');
  };

  if (loading) return <div className="loading">Initializing SplitEase...</div>;

  return (
    <div className="app-container">
      {user && (
        <nav className="navbar glass-card" style={{ margin: '20px', borderRadius: '16px' }}>
          <div className="logo">SplitEase</div>
          <div className="nav-menu" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className={`nav-link ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
              <LayoutDashboard size={18} /> <span>Dashboard</span>
            </div>
            <div className={`nav-link ${view === 'analytics' ? 'active' : ''}`} onClick={() => setView('analytics')}>
              <BarChart2 size={18} /> <span>Analytics</span>
            </div>
            <div className={`nav-link ${view === 'leaderboard' ? 'active' : ''}`} onClick={() => setView('leaderboard')}>
              <Trophy size={18} /> <span>Leaderboard</span>
            </div>
            <div className={`nav-link ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>
              <History size={18} /> <span>History</span>
            </div>
            <div className={`nav-link ${view === 'groups' ? 'active' : ''}`} onClick={() => setView('groups')}>
              <Users size={18} /> <span>Groups</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '20px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
              <UserIcon size={18} />
              <span style={{ fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
              <button onClick={logout} className="btn-outline" style={{ padding: '6px', borderRadius: '8px' }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </nav>
      )}

      <main className="container">
        <AnimatePresence mode="wait">
          {view === 'auth' && <Auth onLogin={login} key="auth" />}
          {view === 'dashboard' && <Dashboard user={user} setView={setView} key="dashboard" />}
          {view === 'add' && <AddExpense setView={setView} key="add" />}
          {view === 'history' && <SettlementHistory key="history" />}
          {view === 'analytics' && <Analytics key="analytics" />}
          {view === 'leaderboard' && <Leaderboard key="leaderboard" />}
          {view === 'groups' && <GroupManagement key="groups" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/signup';
      const res = await axios.post(API_BASE + endpoint, formData);
      if (isLogin) {
        onLogin(res.data.user, res.data.token);
      } else {
        setIsLogin(true);
        setError('Signup successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
      style={{ maxWidth: '400px', margin: '100px auto' }}
    >
      <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
      {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="label">Full Name</label>
            <input type="text" onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>
        )}
        <div className="form-group">
          <label className="label">Email Address</label>
          <input type="email" onChange={e => setFormData({ ...formData, email: e.target.value })} required />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input type="password" onChange={e => setFormData({ ...formData, password: e.target.value })} required />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          {isLogin ? 'Login to SplitEase' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
        <span
          onClick={() => setIsLogin(!isLogin)}
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
        >
          {isLogin ? 'Sign Up' : 'Login'}
        </span>
      </p>
    </motion.div>
  );
}

function Dashboard({ user, setView }) {
  const [summary, setSummary] = useState({ oweMe: [], IOwe: [] });
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const [summRes, expRes] = await Promise.all([
        axios.get(API_BASE + '/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(API_BASE + '/expenses', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setSummary(summRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (payeeId, amount) => {
    if (!window.confirm(`Mark ₹${amount} as settled?`)) return;
    try {
      await axios.post(API_BASE + '/settle', { payeeId, amount }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchData();
    } catch (err) {
      alert('Settlement failed');
    }
  };

  const totalOwedToMe = summary.oweMe.reduce((sum, item) => sum + item.total, 0);
  const totalIOwe = summary.IOwe.reduce((sum, item) => sum + item.total, 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1>Hello, {user?.name.split(' ')[0]}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's your splitting summary</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={fetchData}>
            <RefreshCw size={20} />
          </button>
          <button className="btn btn-primary" onClick={() => setView('add')}>
            <PlusCircle size={20} /> Add Expense
          </button>
        </div>
      </header>

      <div className="grid">
        <div className="glass-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <ArrowDownLeft className="amount positive" />
            <span className="label">You are owed</span>
          </div>
          <div className="amount positive" style={{ fontSize: '2rem' }}>₹{totalOwedToMe.toFixed(2)}</div>
        </div>

        <div className="glass-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <ArrowUpRight className="amount negative" />
            <span className="label">You owe</span>
          </div>
          <div className="amount negative" style={{ fontSize: '2rem' }}>₹{totalIOwe.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: '32px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Debts Summary</h3>
          <div style={{ marginBottom: '24px' }}>
            <div className="label" style={{ marginBottom: '12px' }}>Owed to you</div>
            {summary.oweMe.length === 0 ? (
              <p style={{ fontSize: '0.875rem' }}>No debts to collect! 🎉</p>
            ) : (
              summary.oweMe.map(item => (
                <div key={item.user_id} className="expense-item" style={{ padding: '8px 0' }}>
                  <span style={{ fontWeight: '500' }}>{item.name}</span>
                  <span className="amount positive">₹{item.total.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
            <div className="label" style={{ marginBottom: '12px' }}>You owe</div>
            {summary.IOwe.length === 0 ? (
              <p style={{ fontSize: '0.875rem' }}>You're all settled! ✨</p>
            ) : (
              summary.IOwe.map(item => (
                <div key={item.user_id} className="expense-item" style={{ padding: '8px 0' }}>
                  <span style={{ fontWeight: '500' }}>{item.name}</span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className="amount negative">₹{item.total.toFixed(2)}</span>
                    <button className="btn-outline" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => handleSettle(item.user_id, item.total)}>Settle</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ marginBottom: '20px' }}>Recent Expenses</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {expenses.length === 0 ? (
              <p className="label">No expenses yet. Add one!</p>
            ) : (
              expenses.map(exp => (
                <div
                  key={exp.id}
                  className="expense-item"
                  onClick={() => setSelectedExpense(exp)}
                  style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}
                >
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{exp.description}</span>
                    <span style={{ fontWeight: 700 }}>₹{exp.amount.toFixed(2)}</span>
                  </div>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                    <span className="label">
                      <strong>Added by:</strong> {exp.payer_id === user.id ? 'You' : exp.payer_name}
                    </span>
                    <span className="badge badge-primary">{exp.category}</span>
                  </div>

                  {exp.splits && exp.splits.length > 0 && (
                    <div style={{ fontSize: '0.7rem', marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.6rem' }}>
                        Your Share: ₹{(exp.amount / (exp.splits.length + 1)).toFixed(2)}
                      </span>
                      {exp.splits.map(s => (
                        <span key={s.id} style={{ opacity: 0.8, borderLeft: '1px solid var(--glass-border)', paddingLeft: '8px' }}>
                          {Number(s.user_id) === Number(user.id) ? 'You owe' : `${s.user_name} owes`} ₹{s.amount_owed.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  )}

                  <AnimatePresence>
                    {selectedExpense?.id === exp.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ width: '100%', overflow: 'hidden' }}
                      >
                        <SocialFeatures expenseId={exp.id} expenseDescription={exp.description} />
                        {exp.payer_id !== user.id && (
                          <button
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSettle(exp.payer_id, exp.amount); // Simplification: settle the full amount if I owe it
                            }}
                          >
                            Settle this expense
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AddExpense({ setView }) {
  const [formData, setFormData] = useState({ description: '', amount: '', splitWith: [], category: 'General', groupId: '' });
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = ['General', 'Food', 'Rent', 'Travel', 'Shopping', 'Entertainment', 'Others'];

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API_BASE + '/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get(API_BASE + '/groups', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const onOCRDetected = (data) => {
    setFormData(prev => ({
      ...prev,
      amount: data.amount || prev.amount,
      description: data.merchant || prev.description
    }));
  };

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const toggleFriend = (id) => {
    if (formData.splitWith.includes(id)) {
      setFormData({ ...formData, splitWith: formData.splitWith.filter(uid => uid !== id) });
    } else {
      setFormData({ ...formData, splitWith: [...formData.splitWith, id] });
    }
  };

  const selectAllFriends = () => {
    const allIds = users.filter(u => u.id !== currentUser.id).map(u => u.id);
    if (formData.splitWith.length === allIds.length) {
      setFormData({ ...formData, splitWith: [] });
    } else {
      setFormData({ ...formData, splitWith: allIds });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.splitWith.length === 0) {
      alert('Select at least one friend to split with!');
      return;
    }

    setLoading(true);
    // Ensure all IDs are consistent types (numbers) and include current user
    const finalSplitWith = Array.from(new Set([...formData.splitWith.map(Number), Number(currentUser.id)]));
    const amountVal = parseFloat(formData.amount);

    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount');
      setLoading(false);
      return;
    }

    try {
      await axios.post(API_BASE + '/expenses', {
        ...formData,
        amount: amountVal,
        groupId: formData.groupId || null,
        splitWith: finalSplitWith
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setView('dashboard');
    } catch (err) {
      alert('Failed to add expense: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px' }}>Add New Expense</h2>

      <OCR onDetected={onOCRDetected} />

      <form onSubmit={handleSubmit}>
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="label">Description</label>
            <input
              type="text"
              placeholder="e.g. Dinner, Rent, Movie"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="label">Add to Group</label>
            <select
              value={formData.groupId}
              onChange={async (e) => {
                const gid = e.target.value;
                setFormData({ ...formData, groupId: gid });
                if (gid) {
                  try {
                    const res = await axios.get(`${API_BASE}/groups/${gid}/members`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    // Select all members except current user
                    const memberIds = res.data
                      .map(m => m.id)
                      .filter(id => Number(id) !== Number(currentUser.id));
                    setFormData(prev => ({ ...prev, groupId: gid, splitWith: memberIds }));
                  } catch (err) {
                    console.error('Failed to fetch group members', err);
                  }
                }
              }}
            >
              <option value="">Personal (No Group)</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Amount (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="label">Split with friends (select multiple)</label>
            <button
              type="button"
              onClick={selectAllFriends}
              className="btn-outline"
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              {formData.splitWith.length === users.length - 1 ? 'Deselect All' : 'Select All / Everyone'}
            </button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
            {users.filter(u => Number(u.id) !== Number(currentUser.id)).map(u => (
              <div
                key={u.id}
                onClick={() => toggleFriend(u.id)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: formData.splitWith.includes(u.id) ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  borderBottom: '1px solid var(--glass-border)'
                }}
              >
                <span>{u.name}</span>
                {formData.splitWith.includes(u.id) && <CheckCircle size={18} color="var(--primary)" />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
            {loading ? 'Processing...' : 'Add Expense'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setView('dashboard')}>Cancel</button>
        </div>
      </form>
    </motion.div>
  );
}

function SettlementHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(API_BASE + '/history', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, []);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Settlement History</h2>
        <button className="btn btn-outline" onClick={() => window.print()}>
          Export as PDF/Report
        </button>
      </div>
      <div className="glass-card">
        {history.length === 0 ? (
          <p className="label">No settlements recorded yet.</p>
        ) : (
          history.map(item => (
            <div key={item.id} className="expense-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  background: Number(item.payer_id) === Number(currentUser.id) ? 'var(--danger)' : 'var(--secondary)',
                  padding: '8px',
                  borderRadius: '50%'
                }}>
                  {Number(item.payer_id) === Number(currentUser.id) ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div>
                  <div style={{ fontWeight: '600' }}>
                    {Number(item.payer_id) === Number(currentUser.id) ? `You paid ${item.payee_name}` : `${item.payer_name} paid you`}
                  </div>
                  <div className="label" style={{ fontSize: '0.75rem' }}>{new Date(item.settled_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="amount" style={{ color: Number(item.payer_id) === Number(currentUser.id) ? 'var(--danger)' : 'var(--secondary)' }}>
                ₹{item.amount.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function GroupManagement() {
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(null); // stores the group object being edited
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', members: [] });
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState({}); // {groupId: [members]}

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [gRes, uRes] = await Promise.all([
        axios.get(API_BASE + '/groups', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(API_BASE + '/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setGroups(gRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    if (groupMembers[groupId]) return;
    try {
      const res = await axios.get(`${API_BASE}/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setGroupMembers(prev => ({ ...prev, [groupId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.members.length === 0) {
      alert('Please provide a name and select at least one member!');
      return;
    }
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      if (isEditing) {
        await axios.put(`${API_BASE}/groups/${isEditing.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(API_BASE + '/groups', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setFormData({ name: '', members: [] });
      setIsCreating(false);
      setIsEditing(null);
      fetchData();
    } catch (err) {
      alert('Failed to save group: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(id) 
        ? prev.members.filter(m => m !== id) 
        : [...prev.members, id]
    }));
  };

  const startEdit = async (group) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/groups/${group.id}/members`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setFormData({
        name: group.name,
        members: res.data.map(m => m.id).filter(id => Number(id) !== Number(currentUser.id))
      });
      setIsEditing(group);
      setIsCreating(true);
    } catch (err) {
      alert('Failed to load group members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Groups</h2>
        {!isCreating && (
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            <PlusCircle size={20} /> Create Group
          </button>
        )}
      </header>

      {isCreating ? (
        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3>{isEditing ? 'Edit Group' : 'Create New Group'}</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="label">Group Name</label>
              <input 
                type="text" 
                placeholder="e.g. Flatmates, Trip to Goa" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required 
              />
            </div>
            <div className="form-group">
              <label className="label">Select Members</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '12px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                {users.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => toggleMember(u.id)}
                    style={{ 
                      padding: '12px', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      background: formData.members.includes(u.id) ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      borderBottom: '1px solid var(--glass-border)'
                    }}
                  >
                    <span>{u.name} ({u.email})</span>
                    {formData.members.includes(u.id) && <CheckCircle size={18} color="var(--primary)" />}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                {loading ? 'Saving...' : (isEditing ? 'Update Group' : 'Create Group')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => { setIsCreating(false); setIsEditing(null); setFormData({name: '', members: []}); }}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid">
          {groups.length === 0 ? (
            <div className="glass-card">
              <p className="label">You aren't in any groups yet.</p>
            </div>
          ) : (
            groups.map(g => (
              <div key={g.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '8px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '12px' }}>
                      <Users size={24} color="var(--primary)" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0 }}>{g.name}</h3>
                      <p className="label" style={{ fontSize: '0.75rem' }}>{g.member_count} members</p>
                    </div>
                  </div>
                  {Number(g.created_by) === Number(currentUser.id) && (
                    <button 
                      className="btn-outline" 
                      style={{ padding: '6px', borderRadius: '8px' }}
                      onClick={() => startEdit(g)}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
                
                <button 
                  className="btn-outline" 
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => {
                    if (expandedGroup === g.id) setExpandedGroup(null);
                    else {
                      setExpandedGroup(g.id);
                      fetchGroupMembers(g.id);
                    }
                  }}
                >
                  {expandedGroup === g.id ? 'Hide Members' : 'View Members'}
                </button>

                <AnimatePresence>
                  {expandedGroup === g.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', marginTop: '12px' }}
                    >
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                        {groupMembers[g.id] ? groupMembers[g.id].map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                            <User size={14} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.85rem' }}>{m.name} {Number(m.id) === Number(g.created_by) ? '(Creator)' : ''}</span>
                          </div>
                        )) : <p className="label" style={{ fontSize: '0.8rem' }}>Loading members...</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

export default App;

