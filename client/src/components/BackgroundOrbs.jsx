import React from 'react';
import { motion } from 'framer-motion';

export default function BackgroundOrbs() {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: -1,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'var(--bg-dark)'
        }}>
            {/* Top Right Cyan Orb */}
            <motion.div
                animate={{
                    x: [0, 100, 0, -50, 0],
                    y: [0, 50, 100, 50, 0],
                    scale: [1, 1.2, 1, 0.8, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-5%',
                    width: '50vw',
                    height: '50vw',
                    maxWidth: '800px',
                    maxHeight: '800px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    willChange: 'transform'
                }}
            />

            {/* Bottom Left Pink Orb */}
            <motion.div
                animate={{
                    x: [0, -100, -50, 50, 0],
                    y: [0, -50, -100, -50, 0],
                    scale: [1, 0.9, 1.1, 1, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    bottom: '-10%',
                    left: '-5%',
                    width: '60vw',
                    height: '60vw',
                    maxWidth: '900px',
                    maxHeight: '900px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255, 8, 68, 0.15) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    willChange: 'transform'
                }}
            />

            {/* Center Deep Violet/Magenta Orb (Slower) */}
            <motion.div
                animate={{
                    x: [0, 50, 0, -50, 0],
                    y: [0, -20, 20, -20, 0],
                    scale: [0.8, 1, 0.8, 1.2, 0.8],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
                style={{
                    position: 'absolute',
                    top: '20%',
                    left: '20%',
                    width: '70vw',
                    height: '70vw',
                    maxWidth: '1000px',
                    maxHeight: '1000px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(155, 81, 224, 0.08) 0%, transparent 60%)',
                    filter: 'blur(120px)',
                    mixBlendMode: 'screen',
                    willChange: 'transform'
                }}
            />

            {/* Subtle Grid Overlay over the orbs */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                pointerEvents: 'none'
            }} />
        </div>
    );
}
