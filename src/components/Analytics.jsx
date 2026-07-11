import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, PieChart as PieIcon, BarChart3, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';
const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await axios.get(API_BASE + '/analytics', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="label">Loading analysis...</div>;
    if (!data) return <div className="label">No data available</div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="analytics-container">
            <h2 style={{ marginBottom: '24px' }}>Advanced Analytics</h2>

            <div className="grid">
                {/* Spending Trends */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <TrendingUp size={20} color="var(--primary)" />
                        <h3>Spending trends</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.trends}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip 
                                    contentStyle={{ background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-main)' }}
                                />
                                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <PieIcon size={20} color="var(--secondary)" />
                        <h3>Category breakdown</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.categories}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total"
                                    nameKey="category"
                                >
                                    {data.categories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                     contentStyle={{ background: '#1e293b', border: '1px solid var(--glass-border)', borderRadius: '8px' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Budgets Section */}
            <div className="glass-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <BarChart3 size={20} color="#f59e0b" />
                    <h3>Budgets vs Actual</h3>
                </div>
                {data.budgets.length === 0 ? (
                    <p className="label">No budgets set. Set limits to track your goals!</p>
                ) : (
                    <div className="budget-list">
                        {data.budgets.map(budget => {
                            const percent = Math.min((budget.spent / budget.amount_limit) * 100, 100);
                            const isOver = budget.spent > budget.amount_limit;
                            return (
                                <div key={budget.id} style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 600 }}>{budget.category}</span>
                                        <span className="label">₹{budget.spent} / ₹{budget.amount_limit}</span>
                                    </div>
                                    <div style={{ hieght: '8px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            height: '8px', 
                                            width: `${percent}%`, 
                                            background: isOver ? 'var(--danger)' : 'var(--secondary)',
                                            transition: 'width 0.5s ease'
                                        }}></div>
                                    </div>
                                    {isOver && (
                                        <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertCircle size={12} /> Budget exceeded!
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Insights */}
            <div className="glass-card" style={{ marginTop: '24px', borderLeft: '4px solid var(--primary)' }}>
                <h3>Insights</h3>
                <div style={{ marginTop: '12px' }}>
                    {data.categories.length > 0 && (
                        <p className="label" style={{ color: 'var(--text-main)' }}>
                            💡 You spent the most on <strong>{data.categories.sort((a,b) => b.total - a.total)[0].category}</strong> this period.
                        </p>
                    )}
                    <p className="label" style={{ marginTop: '8px' }}>
                         {data.trends.length > 1 && data.trends[0].total > data.trends[1].total 
                            ? "📈 Your spending is up compared to yesterday."
                            : "📉 Good job! Your spending is down or stable."}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
