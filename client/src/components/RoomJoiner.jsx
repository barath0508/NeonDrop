import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ArrowLeft, Maximize, AlertCircle } from 'lucide-react';

export default function RoomJoiner({ rtcState }) {
    const navigate = useNavigate();
    const [manualId, setManualId] = useState('');
    const [scanMode, setScanMode] = useState(false);
    const { joinRoom, status, error, resetError } = rtcState;

    useEffect(() => {
        if (status === 'connected') {
            navigate('/transfer');
        }
    }, [status, navigate]);

    useEffect(() => {
        if (!scanMode) return;

        // Initialize QR Scanner
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        });

        scanner.render((decodedText) => {
            scanner.clear();
            setScanMode(false);
            joinRoom(decodedText);
        }, (errorMessage) => {
            // ignore empty scans
        });

        return () => {
            scanner.clear().catch(console.error);
        };
    }, [scanMode, joinRoom]);

    const handleJoin = (e) => {
        e.preventDefault();
        if (manualId.trim().length > 0) {
            joinRoom(manualId.trim().toUpperCase());
        }
    };

    return (
        <div className="full-height flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
                <button
                    className="btn"
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 0', marginBottom: '1rem' }}
                    onClick={() => {
                        resetError();
                        navigate('/');
                    }}
                >
                    <ArrowLeft size={20} /> Back
                </button>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    className="glass-panel"
                    style={{ padding: 'clamp(1.5rem, 5vw, 3rem)', textAlign: 'center' }}
                >
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', marginBottom: '1rem', fontWeight: 700 }}>Join Room</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
                        Enter the 6-character room ID or scan the QR code to connect.
                    </p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                        >
                            <AlertCircle size={18} /> {error}
                        </motion.div>
                    )}

                    {scanMode ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ marginBottom: '2rem' }}
                        >
                            <div id="reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 40px rgba(59, 130, 246, 0.15)' }}></div>
                            <button
                                className="btn btn-secondary"
                                style={{ marginTop: '1.5rem', width: '100%' }}
                                onClick={() => setScanMode(false)}
                            >
                                Cancel Scan
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <form onSubmit={handleJoin} style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <input
                                        type="text"
                                        value={manualId}
                                        onChange={(e) => setManualId(e.target.value.toUpperCase())}
                                        placeholder="Enter Room ID"
                                        maxLength={6}
                                        style={{
                                            flex: 1,
                                            padding: '16px',
                                            background: 'rgba(0,0,0,0.5)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: 'var(--border-radius-sm)',
                                            color: 'var(--accent-blue)',
                                            fontSize: '1.3rem',
                                            letterSpacing: '4px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            outline: 'none',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                            transition: 'border 0.3s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                        onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                                    />
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={manualId.length < 1}
                                        style={{ padding: '0 24px' }}
                                    >
                                        Join
                                    </motion.button>
                                </div>
                            </form>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                                <hr style={{ flex: 1, borderColor: 'var(--border-light)' }} />
                                <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '2px' }}>OR</span>
                                <hr style={{ flex: 1, borderColor: 'var(--border-light)' }} />
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="btn btn-secondary"
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                                onClick={() => setScanMode(true)}
                            >
                                <Maximize size={20} />
                                Scan QR Code
                            </motion.button>
                        </motion.div>
                    )}

                    {status === 'connecting' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ marginTop: '1.5rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid var(--accent-blue)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                            Connecting...
                        </motion.div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
