import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, CheckCircle, Activity, X } from 'lucide-react';

export default function FileTransfer({ rtcState }) {
    const navigate = useNavigate();
    const {
        status, sendFile, roomId, error,
        isReceiving, isSending, transferProgress, transferSpeed, incomingFileInfo
    } = rtcState;

    const [dragActive, setDragActive] = useState(false);

    // If disconnected, redirect home
    React.useEffect(() => {
        if (status !== 'connected' && status !== 'connecting') {
            // Could show a disconnected modal instead, but for simplicity navigate out with a timeout
            const timer = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files) => {
        const file = files[0];
        if (file && !isSending && !isReceiving) {
            sendFile(file);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatSpeed = (speedBps) => {
        // converting bps to Mbps (Mega bits per second) -> 1 byte = 8 bits
        const mbps = (speedBps * 8) / (1024 * 1024);
        return mbps.toFixed(2) + ' Mbps';
    };

    return (
        <div className="full-height flex-center" style={{ flexDirection: 'column', gap: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>

                {/* Header bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connected Room</span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-green)' }}>{roomId}</div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', color: 'var(--accent-red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => window.location.href = '/'} // Force reload to clear WebRTC states
                    >
                        <X size={18} /> Disconnect
                    </button>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--accent-red)', padding: '16px', borderRadius: '8px', marginBottom: '1.5rem' }}>
                        {error} Returning home...
                    </div>
                )}

                <motion.div
                    className="glass-panel"
                    style={{ position: 'relative', overflow: 'hidden' }}
                >
                    {/* Active Transfer Overlay */}
                    <AnimatePresence>
                        {(isSending || isReceiving) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(15, 15, 20, 0.85)',
                                    zIndex: 10,
                                    display: 'flex', flexDirection: 'column',
                                    padding: 'var(--container-padding)',
                                    backdropFilter: 'blur(30px) saturate(150%)'
                                }}
                            >
                                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                                        {isSending ? 'Sending File...' : 'Receiving File...'}
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary)' }}>
                                        {isSending ? 'Do not close this window' : incomingFileInfo?.name}
                                    </p>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    {/* Glowing Progress Ring & Bar */}
                                    <div style={{ position: 'relative', height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                                        <motion.div
                                            style={{
                                                position: 'absolute', top: 0, left: 0, height: '100%',
                                                background: 'var(--accent-gradient)',
                                                width: `${transferProgress}%`,
                                                boxShadow: '0 0 20px var(--accent-glow)'
                                            }}
                                            layout
                                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 'bold' }}>
                                        <span style={{ color: 'var(--text-primary)' }}>{transferProgress}%</span>
                                        <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Activity size={18} />
                                            {formatSpeed(transferSpeed)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success Overlay (Completing transfer) */}
                    <AnimatePresence>
                        {transferProgress === 100 && (!isSending && !isReceiving) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    zIndex: 20,
                                    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                                    backdropFilter: 'blur(20px)'
                                }}
                            >
                                <CheckCircle size={64} color="var(--accent-green)" style={{ marginBottom: '1rem' }} />
                                <h2 style={{ color: 'var(--accent-green)' }}>Transfer Complete!</h2>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Default Dropzone */}
                    <motion.div
                        style={{
                            padding: 'clamp(2rem, 8vw, 4rem) 2rem',
                            textAlign: 'center',
                            border: `2px dashed ${dragActive ? 'var(--accent-blue)' : 'var(--border-light)'}`,
                            borderRadius: 'var(--border-radius-lg)',
                            background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                            transition: 'all 0.4s var(--ease-spring)',
                            cursor: 'pointer'
                        }}
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.02)' }}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: 'none' }}
                            onChange={handleChange}
                        />
                        <motion.div
                            style={{ marginBottom: '1.5rem' }}
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div
                                style={{
                                    display: 'inline-flex', padding: '24px',
                                    borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)',
                                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.15)'
                                }}
                            >
                                <UploadCloud size={48} color="var(--accent-blue)" />
                            </div>
                        </motion.div>
                        <h2 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Drag & Drop to Send</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '300px', margin: '0 auto 2rem auto' }}>
                            Select any file or media. No size limits.
                        </p>
                        <span className="btn btn-primary" style={{ padding: '14px 32px' }}>
                            Browse Files
                        </span>
                    </motion.div>
                </motion.div>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <File size={16} /> Direct P2P connection active. High-speed transfer ready.
                </div>
            </div>
        </div>
    );
}
