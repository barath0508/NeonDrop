import React, { useCallback, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    UploadCloud, CheckCircle, Activity, X, Send,
    File, FileText, Image, Video, Music, Archive, Code2,
    ArrowUpRight, ArrowDownLeft, Clock, ChevronDown, ChevronUp, Download
} from 'lucide-react';

// --- File Type Utilities ---
function getFileIcon(type) {
    if (!type) return File;
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type === 'application/pdf') return FileText;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar') || type.includes('gzip')) return Archive;
    if (type.startsWith('text/') || type.includes('json') || type.includes('xml') || type.includes('javascript') || type.includes('typescript')) return Code2;
    if (type.includes('word') || type.includes('document') || type.includes('spreadsheet') || type.includes('presentation')) return FileText;
    return File;
}

function getFileColor(type) {
    if (!type) return 'var(--text-secondary)';
    if (type.startsWith('image/')) return '#00f2fe';
    if (type.startsWith('video/')) return '#ff0844';
    if (type.startsWith('audio/')) return '#9b51e0';
    if (type === 'application/pdf') return '#ff6b6b';
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '#ffd700';
    if (type.startsWith('text/') || type.includes('json') || type.includes('javascript')) return '#00ff87';
    return 'var(--text-secondary)';
}

function formatSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(speedBps) {
    const mbps = (speedBps * 8) / (1024 * 1024);
    return mbps.toFixed(2) + ' Mbps';
}

// --- Sub-components ---
function FileRow({ file, index, isImage }) {
    const Icon = getFileIcon(file.type);
    const color = getFileColor(file.type);
    const [thumbUrl] = useState(() => isImage ? URL.createObjectURL(file) : null);

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)'
            }}
        >
            {thumbUrl ? (
                <img src={thumbUrl} alt={file.name} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
            ) : (
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatSize(file.size)}</div>
            </div>
        </motion.div>
    );
}

function HistoryRow({ item }) {
    const Icon = getFileIcon(item.type);
    const color = getFileColor(item.type);
    const isSent = item.direction === 'sent';

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: '10px',
            background: isSent ? 'rgba(0, 242, 254, 0.05)' : 'rgba(0, 255, 135, 0.05)',
            border: `1px solid ${isSent ? 'rgba(0, 242, 254, 0.12)' : 'rgba(0, 255, 135, 0.12)'}`
        }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={10} /> {item.timestamp} · {formatSize(item.size)}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {isSent
                    ? <ArrowUpRight size={16} color="var(--accent-blue)" />
                    : <ArrowDownLeft size={16} color="var(--accent-green)" />
                }
                {item.blobUrl && (
                    <a href={item.blobUrl} download={item.name} onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', padding: '4px', borderRadius: '6px', background: 'rgba(0,255,135,0.1)', color: 'var(--accent-green)' }}>
                        <Download size={14} />
                    </a>
                )}
            </div>
        </div>
    );
}

// --- Main Component ---
export default function FileTransfer({ rtcState }) {
    const navigate = useNavigate();
    const {
        status, sendFiles, roomId, error,
        isReceiving, isSending, transferProgress,
        transferSpeed, incomingFileInfo,
        currentQueueIndex, totalQueueLength,
        transferHistory
    } = rtcState;

    const [dragActive, setDragActive] = useState(false);
    const [dragCount, setDragCount] = useState(0);
    const [stagedFiles, setStagedFiles] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isPendingSend, setIsPendingSend] = useState(false);

    React.useEffect(() => {
        if (status !== 'connected' && status !== 'connecting') {
            const timer = setTimeout(() => navigate('/'), 3000);
            return () => clearTimeout(timer);
        }
    }, [status, navigate]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
            setDragCount(e.dataTransfer?.items?.length || 0);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
            setDragCount(0);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setDragCount(0);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setStagedFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    const handleChange = useCallback((e) => {
        e.preventDefault();
        if (e.target.files && e.target.files.length > 0) {
            setStagedFiles(Array.from(e.target.files));
        }
    }, []);

    const handleSendAll = useCallback(() => {
        if (!isSending && !isReceiving && stagedFiles.length > 0) {
            setIsPendingSend(true);
            const filesToSend = stagedFiles;
            setStagedFiles([]);
            sendFiles(filesToSend).finally(() => setIsPendingSend(false));
        }
    }, [stagedFiles, isSending, isReceiving, sendFiles]);

    const clearStaged = useCallback(() => setStagedFiles([]), []);

    const isTransferring = isSending || isReceiving || isPendingSend;
    const queueLabel = totalQueueLength > 1
        ? `File ${currentQueueIndex} of ${totalQueueLength}`
        : (isSending ? 'Sending File...' : 'Receiving File...');

    return (
        <div className="full-height flex-center" style={{ flexDirection: 'column', gap: '1.5rem', paddingTop: '2rem', paddingBottom: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '660px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Connected Room</span>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.1em' }}>{roomId}</div>
                    </div>
                    <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 16px', color: 'var(--accent-red)', borderColor: 'rgba(255, 8, 68, 0.3)' }}
                        onClick={() => window.location.href = '/'}
                    >
                        <X size={16} /> Disconnect
                    </button>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255, 8, 68, 0.15)', color: 'var(--accent-red)', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255, 8, 68, 0.3)' }}>
                        ⚠️ {error} — Returning home...
                    </div>
                )}

                {/* Main Transfer Panel */}
                <motion.div className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>

                    {/* Active Transfer Overlay */}
                    <AnimatePresence>
                        {isTransferring && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(15, 12, 41, 0.92)',
                                    zIndex: 10, display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', padding: '2.5rem',
                                    backdropFilter: 'blur(30px)'
                                }}
                            >
                                <motion.div
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: '1.5rem', textAlign: 'center' }}
                                >
                                    {queueLabel}
                                </motion.div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {isSending ? 'Sending...' : (incomingFileInfo?.name || 'Receiving...')}
                                </div>

                                {/* Progress Bar */}
                                <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden', margin: '1.5rem 0', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                                    <motion.div
                                        style={{
                                            position: 'relative', height: '100%',
                                            background: 'var(--accent-gradient)',
                                            boxShadow: '0 0 20px var(--accent-glow)',
                                            width: `${transferProgress}%`
                                        }}
                                        layout
                                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    <span>{transferProgress}%</span>
                                    <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Activity size={16} />{formatSpeed(transferSpeed)}
                                    </span>
                                </div>

                                {/* Queue dots */}
                                {totalQueueLength > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1.5rem' }}>
                                        {Array.from({ length: totalQueueLength }).map((_, i) => (
                                            <motion.div key={i}
                                                animate={{ opacity: i < currentQueueIndex ? 1 : 0.3, scale: i === currentQueueIndex - 1 ? 1.3 : 1 }}
                                                style={{ width: 8, height: 8, borderRadius: '50%', background: i < currentQueueIndex ? 'var(--accent-blue)' : 'rgba(255,255,255,0.2)' }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success overlay */}
                    <AnimatePresence>
                        {transferProgress === 100 && !isTransferring && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                style={{
                                    position: 'absolute', inset: 0, background: 'rgba(0, 255, 135, 0.08)',
                                    zIndex: 20, display: 'flex', flexDirection: 'column',
                                    justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(20px)'
                                }}
                            >
                                <CheckCircle size={56} color="var(--accent-green)" style={{ marginBottom: '1rem', filter: 'drop-shadow(0 0 20px rgba(0,255,135,0.4))' }} />
                                <h2 style={{ color: 'var(--accent-green)' }}>
                                    {totalQueueLength > 1 ? `All ${totalQueueLength} files transferred!` : 'Transfer Complete!'}
                                </h2>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Staged File Queue Panel */}
                    <AnimatePresence>
                        {stagedFiles.length > 0 && !isTransferring && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                style={{ padding: '1.5rem' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                                        Ready to send — <span style={{ color: 'var(--accent-blue)' }}>{stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''}</span>
                                    </h3>
                                    <button onClick={clearStaged} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                                    {stagedFiles.map((f, i) => (
                                        <FileRow key={i} file={f} index={i} isImage={f.type.startsWith('image/')} />
                                    ))}
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}
                                    onClick={handleSendAll}
                                >
                                    <Send size={20} />
                                    Send {stagedFiles.length > 1 ? `All ${stagedFiles.length} Files` : stagedFiles[0]?.name}
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Dropzone */}
                    {stagedFiles.length === 0 && !isTransferring && (
                        <motion.div
                            style={{
                                padding: 'clamp(2rem, 8vw, 4rem) 2rem',
                                textAlign: 'center',
                                border: `2px dashed ${dragActive ? 'var(--accent-blue)' : 'var(--border-light)'}`,
                                borderRadius: 'var(--border-radius-lg)',
                                background: dragActive ? 'rgba(0, 242, 254, 0.04)' : 'transparent',
                                transition: 'all 0.3s var(--ease-spring)',
                                cursor: 'pointer', position: 'relative'
                            }}
                            whileHover={{ scale: 1.01 }}
                            onDragEnter={handleDrag} onDragLeave={handleDrag}
                            onDragOver={handleDrag} onDrop={handleDrop}
                            onClick={() => document.getElementById('file-upload').click()}
                        >
                            <input
                                type="file" id="file-upload" multiple
                                accept="*/*"
                                style={{ display: 'none' }}
                                onChange={handleChange}
                            />
                            {dragActive && dragCount > 1 && (
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{
                                        position: 'absolute', top: '1rem', right: '1rem',
                                        background: 'var(--accent-gradient)', borderRadius: '20px',
                                        padding: '4px 12px', fontSize: '0.85rem', fontWeight: 700
                                    }}
                                >
                                    +{dragCount} files
                                </motion.div>
                            )}
                            <motion.div
                                style={{ marginBottom: '1.5rem' }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <div style={{
                                    display: 'inline-flex', padding: '24px', borderRadius: '50%',
                                    background: 'rgba(0, 242, 254, 0.08)',
                                    boxShadow: dragActive ? '0 0 50px rgba(0, 242, 254, 0.3)' : '0 0 20px rgba(0, 242, 254, 0.1)',
                                    transition: 'box-shadow 0.3s'
                                }}>
                                    <UploadCloud size={48} color="var(--accent-blue)" />
                                </div>
                            </motion.div>
                            <h2 style={{ marginBottom: '0.75rem' }}>Drag & Drop Files</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                Images · Videos · Audio · PDFs · ZIPs · Code · Any format
                            </p>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.85rem', opacity: 0.6 }}>
                                No size limits. Multiple files supported.
                            </p>
                            <span className="btn btn-primary" style={{ padding: '12px 28px', pointerEvents: 'none' }}>
                                Browse Files
                            </span>
                        </motion.div>
                    )}
                </motion.div>

                {/* Transfer History */}
                {transferHistory.length > 0 && (
                    <motion.div
                        className="glass-panel"
                        style={{ padding: '1.25rem' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <button
                            onClick={() => setShowHistory(h => !h)}
                            style={{
                                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                color: 'var(--text-primary)', padding: 0
                            }}
                        >
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} color="var(--text-secondary)" />
                                Transfer History <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({transferHistory.length})</span>
                            </span>
                            {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {transferHistory.map(item => (
                                            <HistoryRow key={item.id} item={item} />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Bottom hint */}
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem' }}>
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }}
                    />
                    Direct P2P encrypted channel active
                </div>
            </div>
        </div>
    );
}
