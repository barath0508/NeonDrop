import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Send, Download, Zap, Shield, Globe, Lock, Cpu, ServerOff } from 'lucide-react';

// Reusable component for feature cards
const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, delay: delay }}
        className="glass-panel"
        style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 300px', borderTop: '1px solid var(--border-focus)' }}
    >
        <div style={{
            background: 'var(--accent-glow)', width: '56px', height: '56px',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-glow)'
        }}>
            <Icon size={32} color="var(--accent-blue)" />
        </div>
        <h3 style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '1.05rem' }}>{description}</p>
    </motion.div>
);

export default function Home({ rtcState }) {
    const navigate = useNavigate();

    return (
        <div style={{ width: '100%', overflowX: 'hidden' }}>
            {/* HERO SECTION */}
            <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '3rem', paddingTop: '4rem', paddingBottom: '4rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
                        style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}
                    >
                        <div style={{
                            background: 'var(--accent-gradient)', padding: '20px',
                            borderRadius: '50%', boxShadow: '0 0 40px var(--accent-glow)',
                            position: 'relative'
                        }}>
                            <Zap size={40} color="white" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: 'absolute', inset: '-4px', borderRadius: '50%',
                                    border: '1px dashed rgba(255,255,255,0.4)', pointerEvents: 'none'
                                }}
                            />
                        </div>
                    </motion.div>
                    <h1 style={{ fontWeight: 800, marginBottom: '1.5rem', textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        Neon <span className="text-gradient">Drop</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '550px', margin: '0 auto', fontSize: '1.15rem' }}>
                        The fastest, most secure way to send files globally. Zero server routing. Unlimited file sizes. Pure Peer-to-Peer networking running at the physical limit of your connection.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="glass-panel"
                    style={{
                        padding: 'clamp(1.5rem, 5vw, 3rem)',
                        display: 'flex', gap: '1.5rem',
                        width: '100%', maxWidth: '500px',
                        flexDirection: 'column'
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '18px', fontSize: '1.15rem' }}
                        onClick={() => navigate('/create')}
                    >
                        <Send size={22} />
                        Send Files
                    </motion.button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
                        <hr style={{ flex: 1, borderColor: 'var(--border-light)' }} />
                        <span style={{ padding: '0 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '2px' }}>OR</span>
                        <hr style={{ flex: 1, borderColor: 'var(--border-light)' }} />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn btn-secondary"
                        style={{ width: '100%', padding: '18px', fontSize: '1.15rem' }}
                        onClick={() => navigate('/join')}
                    >
                        <Download size={22} />
                        Receive Files
                    </motion.button>
                </motion.div>

                {/* SCROLL INDICATOR */}
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}
                    style={{ color: 'var(--text-secondary)', marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
                >
                    <span style={{ fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>Scroll to learn more</span>
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                        ↓
                    </motion.div>
                </motion.div>
            </div>

            {/* FEATURES SECTION */}
            <div className="container" style={{ paddingBottom: '8rem', paddingTop: '4rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="text-center" style={{ marginBottom: '4rem' }}
                >
                    <h2 style={{ marginBottom: '1.5rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Why choose NeonDrop?</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1.1rem' }}>Traditional cloud storage is slow, expensive, and insecure. We bypass the cloud entirely to establish a direct pipeline between your devices.</p>
                </motion.div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                    <FeatureCard
                        icon={ServerOff} delay={0.1}
                        title="Zero Servers"
                        description="Your files never touch our servers. We use WebRTC to punch a direct hole between the sender and receiver, bypassing cloud storage entirely."
                    />
                    <FeatureCard
                        icon={Globe} delay={0.2}
                        title="Maximum Speed"
                        description="If you're on the same Wi-Fi, transfers occur over your local router at Gigabit speeds, instantly sidestepping your ISP's internet limits."
                    />
                    <FeatureCard
                        icon={Lock} delay={0.3}
                        title="End-to-End Encryption"
                        description="Because the connection is peer-to-peer, your data is cryptographically sealed in transit. Not even we can see what you're sending."
                    />
                    <FeatureCard
                        icon={Cpu} delay={0.4}
                        title="No Size Limits"
                        description="Since we don't pay for cloud storage to temporarily hold your files, there are no artificial limits. Send a 100GB 4K movie effortlessly."
                    />
                </div>
            </div>

            {/* TRUST BANNER */}
            <div style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '1px', background: 'var(--accent-gradient)', opacity: 0.5 }}></div>
                <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                    <motion.div
                        initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', bounce: 0.5 }}
                    >
                        <Shield size={64} color="var(--accent-green)" style={{ filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))' }} />
                    </motion.div>
                    <h2 style={{ maxWidth: '800px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1 }}>Your Privacy is Mathematically Guaranteed.</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '700px', fontSize: '1.15rem', lineHeight: 1.6 }}>
                        NeonDrop is essentially a smart walkie-talkie for data. Once the connection is established via our signaling server, the transfer happens exclusively and privately between your two devices over an encrypted DTLS tunnel.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{ marginTop: '2rem', padding: '18px 40px', fontSize: '1.2rem' }}
                    >
                        Start Transferring Now
                    </motion.button>
                </div>
            </div>

            {/* FOOTER */}
            <div className="container" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '1rem', opacity: 0.5 }}>
                    <Zap size={16} /> NeonDrop
                </div>
                <p>© 2026 NeonDrop. Built with WebRTC and React.</p>
            </div>
        </div>
    );
}
