import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

export default function OCR({ onDetected }) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
            scanReceipt(file);
        }
    };

    const scanReceipt = (file) => {
        setLoading(true);
        Tesseract.recognize(
            file,
            'eng',
            { 
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            }
        ).then(({ data: { text } }) => {
            console.log("OCR Text:", text);
            parseText(text);
        }).catch(err => {
            console.error(err);
            alert('OCR failed');
        }).finally(() => {
            setLoading(false);
        });
    };

    const parseText = (text) => {
        // Simple regex to find amounts and dates
        // Look for currency symbols or numbers with decimals
        const amounts = text.match(/\d+[\.,]\d{2}/g) || [];
        const maxAmount = amounts.length > 0 
            ? Math.max(...amounts.map(a => parseFloat(a.replace(',', '.')))) 
            : null;

        // Look for dates (simplified)
        const dates = text.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/) || [];
        
        // Look for typical merchant names (very simplified)
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const merchant = lines[0] || 'Unknown Merchant'; // Often the first line is the name

        onDetected({
            amount: maxAmount,
            date: dates[0] || null,
            merchant: merchant,
            text: text
        });
    };

    return (
        <div className="ocr-container" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '50%' }}>
                    <Camera size={20} />
                </div>
                <div>
                    <h4 style={{ margin: 0 }}>Smart Receipt Scan</h4>
                    <p className="label" style={{ fontSize: '0.75rem' }}>Upload a photo to auto-fill</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderStyle: 'dashed' }}>
                {loading ? (
                    <div>
                        <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px', animation: 'spin 2s linear infinite' }} />
                        <div className="label">Scanning receipt... {progress}%</div>
                    </div>
                ) : (
                    <div>
                        {preview ? (
                            <div style={{ marginBottom: '12px' }}>
                                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} />
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                                    <label htmlFor="ocr-upload" className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
                                        Retake
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label htmlFor="ocr-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                                Choose Receipt Photo
                            </label>
                        )}
                        <input 
                            id="ocr-upload" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            style={{ display: 'none' }} 
                        />
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
