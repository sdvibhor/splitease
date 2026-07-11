import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Heart, Share2, Send, Smile } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function SocialFeatures({ expenseId, expenseDescription }) {
    const [comments, setComments] = useState([]);
    const [reactions, setReactions] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

    useEffect(() => {
        fetchSocialData();
    }, [expenseId]);

    const fetchSocialData = async () => {
        try {
            const [commRes, reactRes] = await Promise.all([
                axios.get(`${API_BASE}/expenses/${expenseId}/comments`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }),
                axios.get(`${API_BASE}/expenses/${expenseId}/reactions`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })
            ]);
            setComments(commRes.data);
            setReactions(reactRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/expenses/${expenseId}/comments`, { comment: newComment }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setNewComment('');
            fetchSocialData();
        } catch (err) {
            alert('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    const handleAddReaction = async (emoji) => {
        try {
            await axios.post(`${API_BASE}/expenses/${expenseId}/reactions`, { emoji }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setShowEmojiPicker(false);
            fetchSocialData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleShare = () => {
        const text = `Check out this expense on SplitEase: ${expenseDescription}! Join me in managing our finances.`;
        if (navigator.share) {
            navigator.share({
                title: 'SplitEase Expense',
                text: text,
                url: window.location.origin
            });
        } else {
            navigator.clipboard.writeText(`${text} ${window.location.origin}`);
            alert('Share link copied to clipboard!');
        }
    };

    return (
        <div className="social-features" style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <button className="btn-social" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <Smile size={18} /> React
                </button>
                <button className="btn-social" onClick={handleShare}>
                    <Share2 size={18} /> Share
                </button>
            </div>

            <AnimatePresence>
                {showEmojiPicker && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{ 
                            background: 'var(--card-bg)', 
                            padding: '8px', 
                            borderRadius: '12px', 
                            display: 'flex', 
                            gap: '8px',
                            marginBottom: '16px',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        {emojis.map(e => (
                            <span key={e} onClick={() => handleAddReaction(e)} style={{ cursor: 'pointer', fontSize: '1.5rem' }}>{e}</span>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {reactions.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {reactions.map((r, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.875rem' }}>
                            {r.emoji} {r.count}
                        </div>
                    ))}
                </div>
            )}

            <div className="comments-section">
                <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={16} /> Comments
                </h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                    {comments.length === 0 ? (
                        <p className="label" style={{ fontSize: '0.8rem' }}>No comments yet.</p>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '4px' }}>{c.user_name}</div>
                                <div style={{ fontSize: '0.875rem' }}>{c.comment}</div>
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                        type="text" 
                        value={newComment} 
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Add a comment..." 
                        style={{ margin: 0, height: '40px' }}
                    />
                    <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 16px', borderRadius: '8px' }}>
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
