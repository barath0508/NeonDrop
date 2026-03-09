import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { v4 as uuidv4 } from 'uuid';
import { Copy, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

export default function RoomCreator({ rtcState }) {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const { createRoom, roomId, status, isSocketReady } = rtcState;

    useEffect(() => {
        // Generate room on mount once socket is ready
        if (isSocketReady && !roomId && status === 'idle') {
            const newRoom = uuidv4().slice(0, 6).toUpperCase();
            createRoom(newRoom);
        }
    }, [createRoom, roomId, status, isSocketReady]);

    useEffect(() => {
        if (status === 'connected') {
            navigate('/transfer');
        }
    }, [status, navigate]);

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="full-height flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '500px' }}>
                <button
                    className="btn"
                    style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px 0', marginBottom: '1rem' }}
                    onClick={() => navigate('/')}
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
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.2rem)', marginBottom: '1rem', fontWeight: 700 }}>Share this Room</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
                        Scan the QR code or share the ID to connect seamlessly.
                    </p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            background: 'white',
                            padding: '1.5rem',
                            borderRadius: 'var(--border-radius-md)',
                            display: 'inline-block',
                            marginBottom: '2.5rem',
                            boxShadow: '0 0 30px rgba(255,255,255,0.1)'
                        }}
                    >
                        {roomId ? (
                            <QRCodeSVG value={roomId} size={200} />
                        ) : (
                            <div className="flex-center" style={{ height: 200, width: 200 }}>
                                <Loader2 size={40} className="animate-spin" color="var(--bg-dark)" />
                            </div>
                        )}
                    </motion.div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(0,0,0,0.5)',
                            padding: '12px 16px',
                            borderRadius: 'var(--border-radius-sm)',
                            border: '1px solid var(--border-light)',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '6px', color: 'var(--accent-blue)' }}>
                            {roomId || '------'}
                        </span>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleCopy}
                            className="btn"
                            style={{ padding: '10px', background: 'var(--accent-gradient)', color: 'white', minWidth: '44px', borderRadius: '8px' }}
                        >
                            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                        </motion.button>
                    </div>

                    <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--accent-green)', fontWeight: 500 }}>
                        <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} />
                        Waiting for receiver to join...
                    </div>
                </motion.div>
            </div>

            <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
        </div>
    );
}
