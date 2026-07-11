import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Zap, Wallet, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

export default function Leaderboard({ groupId = null }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`${API_BASE}/leaderboard${groupId ? `?groupId=${groupId}` : ''}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [groupId]);

    if (loading) return <div className="label">Loading rankings...</div>;
    if (!data) return <div className="label">No data available</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="leaderboard">
            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Trophy color="#f59e0b" /> Group Hall of Fame
            </h2>

            <div className="grid">
                {/* Biggest Spenders */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Wallet size={20} color="var(--primary)" />
                        <h3>Biggest Spenders</h3>
                    </div>
                    {data.spenders.map((u, i) => (
                        <div key={i} className="expense-item" style={{ border: 'none', padding: '12px 0' }}>
                            <span>{i + 1}. {u.name}</span>
                            <span style={{ fontWeight: 700 }}>₹{u.total_spent.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* Fastest Settlers */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Zap size={20} color="var(--secondary)" />
                        <h3>Fastest Settlers</h3>
                    </div>
                    {data.settlers.map((u, i) => (
                        <div key={i} className="expense-item" style={{ border: 'none', padding: '12px 0' }}>
                            <span>{i + 1}. {u.name}</span>
                            <span style={{ color: 'var(--secondary)' }}>{Math.round(u.avg_minutes)}m avg</span>
                        </div>
                    ))}
                    {data.settlers.length === 0 && <p className="label">No settlements yet</p>}
                </div>

                {/* Who owes most */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <TrendingUp size={20} color="var(--danger)" />
                        <h3>Top Debtors</h3>
                    </div>
                    {data.debtors.map((u, i) => (
                        <div key={i} className="expense-item" style={{ border: 'none', padding: '12px 0' }}>
                            <span>{i + 1}. {u.name}</span>
                            <span style={{ color: 'var(--danger)' }}>₹{u.total_owed.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
