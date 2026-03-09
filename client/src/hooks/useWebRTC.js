import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const CHUNK_SIZE = 256 * 1024; // 256KB chunks (maximum safe threshold for modern WebRTC data channels)
const MAX_BUFFER_SIZE = 8 * 1024 * 1024; // Safe 8MB buffer limit (Chrome can crash on 16MB+)

export function useWebRTC() {
    const [socket, setSocket] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [dataChannel, setDataChannel] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [status, setStatus] = useState('idle'); // idle, creating, joining, waiting, connecting, connected
    const [error, setError] = useState('');

    // File Transfer State
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [incomingFileInfo, setIncomingFileInfo] = useState(null);
    const [incomingChunks, setIncomingChunks] = useState([]);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferSpeed, setTransferSpeed] = useState(0);
    const [isReceiving, setIsReceiving] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const pcRef = useRef(null);
    const dcRef = useRef(null);
    const socketRef = useRef(null);

    // Speed metrics
    const lastProgressRef = useRef(0);
    const lastTimeRef = useRef(Date.now());

    useEffect(() => {
        // Use the environment variable. In local dev, this is http://localhost:4000.
        // In production, set VITE_SIGNALING_SERVER to the deployed Render/Railway URL.
        const serverUrl = import.meta.env.VITE_SIGNALING_SERVER || `http://${window.location.hostname}:4000`;

        const newSocket = io(serverUrl);
        newSocket.on('connect', () => setIsSocketReady(true));
        newSocket.on('disconnect', () => setIsSocketReady(false));
        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.disconnect();
            if (pcRef.current) pcRef.current.close();
        };
    }, []);

    const createPeerConnection = useCallback((currentRoomId) => {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                // Add Cloudflare's high-performance public STUN for better NAT traversal routing
                { urls: 'stun:stun.cloudflare.com:3478' }
            ],
            // Help ensure the browser doesn't try to use a slow relay if it can avoid it
            iceTransportPolicy: 'all',
        });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit('ice-candidate', {
                    candidate: event.candidate,
                    roomId: currentRoomId,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setStatus('connected');
            } else if (pc.connectionState === 'failed') {
                setStatus('disconnected');
                setError('Peer connection failed');
            } else if (pc.connectionState === 'disconnected') {
                // Allow time for reconnection (e.g. when app is backgrounded on mobile)
                setTimeout(() => {
                    if (pcRef.current && pcRef.current.connectionState === 'disconnected') {
                        setStatus('disconnected');
                        setError('Peer disconnected');
                    }
                }, 10000);
            }
        };

        // Receive data channel
        pc.ondatachannel = (event) => {
            const receiveChannel = event.channel;
            setupDataChannel(receiveChannel);
        };

        pcRef.current = pc;
        setPeerConnection(pc);
        return pc;
    }, []);

    const setupDataChannel = useCallback((channel) => {
        channel.binaryType = 'arraybuffer';

        channel.onopen = () => {
            console.log('Data channel open');
            setStatus('connected');
        };

        channel.onclose = () => {
            console.log('Data channel closed');
        };

        let receivedSize = 0;
        let fileBuffer = [];
        let currentMetadata = null;
        let t0 = Date.now();

        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
                // Metadata message
                const message = JSON.parse(event.data);
                if (message.type === 'file-start') {
                    currentMetadata = message.meta;
                    setIncomingFileInfo(currentMetadata);
                    setIsReceiving(true);
                    setTransferProgress(0);
                    receivedSize = 0;
                    fileBuffer = [];
                    t0 = Date.now();
                    lastTimeRef.current = t0;
                    lastProgressRef.current = 0;
                } else if (message.type === 'file-end') {
                    // File complete, save it
                    const blob = new Blob(fileBuffer);
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = currentMetadata.name;
                    a.click();

                    setIsReceiving(false);
                    setTransferProgress(100);
                    setTimeout(() => {
                        setTransferProgress(0);
                        setIncomingFileInfo(null);
                    }, 3000);
                }
            } else {
                // Binary chunk
                fileBuffer.push(event.data);
                receivedSize += event.data.byteLength;

                if (currentMetadata) {
                    // Update state variables (refs) without triggering React re-renders directly
                    lastProgressRef.current = receivedSize;
                }
            }
        };

        // Decoupled UI Updater Interval (runs 4 times a second)
        const uiInterval = setInterval(() => {
            if (currentMetadata && lastProgressRef.current > 0) {
                const currentReceived = lastProgressRef.current;
                const progress = Math.round((currentReceived / currentMetadata.size) * 100);

                // Only update React state if it actually changed
                setTransferProgress(prev => (prev !== progress ? progress : prev));

                const now = Date.now();
                const timeDiff = (now - lastTimeRef.current) / 1000;
                if (timeDiff >= 0.25) {
                    const bytesSinceLast = currentReceived - (window.lastBpsSync || 0);
                    const speedBps = bytesSinceLast / timeDiff;
                    setTransferSpeed(speedBps);
                    lastTimeRef.current = now;
                    window.lastBpsSync = currentReceived;
                }
            }
        }, 250);

        channel.onclose = () => {
            console.log('Data channel closed');
            clearInterval(uiInterval);
        };

        dcRef.current = channel;
        setDataChannel(channel);
    }, []);

    // Socket event listeners orchestration
    useEffect(() => {
        if (!socket) return;

        socket.on('room-created', (id) => {
            setRoomId(id);
            setStatus('waiting');
        });

        socket.on('room-joined', async (id) => {
            setRoomId(id);
            setStatus('connecting');
            // The person who joins does NOT create the offer. Sender creates it.
        });

        socket.on('peer-joined', async (peerId) => {
            // Receiver joined, Sender creates offer
            setStatus('connecting');
            const pc = createPeerConnection(roomId);

            // Create data channel before offering with reliable ordered stream settings
            const dc = pc.createDataChannel('fileTransfer', {
                ordered: true // Ensures TCP-like reliability and prevents out-of-order packet stall
            });
            setupDataChannel(dc);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('offer', { sdp: offer, roomId });
        });

        socket.on('offer', async ({ sdp }) => {
            const pc = createPeerConnection(roomId);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', { sdp: answer, roomId });
        });

        socket.on('answer', async ({ sdp }) => {
            if (pcRef.current) {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
            }
        });

        socket.on('ice-candidate', async ({ candidate }) => {
            if (pcRef.current) {
                try {
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.error('Error adding received ice candidate', e);
                }
            }
        });

        socket.on('peer-left', () => {
            // If WebRTC is already established, a signaling drop doesn't break the P2P connection.
            if (pcRef.current && pcRef.current.connectionState === 'connected') {
                console.log('Signaling peer left, but WebRTC remains intact.');
                return;
            }
            setStatus('disconnected');
            setError('Peer left the room');
        });

        socket.on('room-error', (err) => {
            setError(err);
            setStatus('idle');
        });

        return () => {
            socket.off('room-created');
            socket.off('room-joined');
            socket.off('peer-joined');
            socket.off('offer');
            socket.off('answer');
            socket.off('ice-candidate');
            socket.off('peer-left');
            socket.off('room-error');
        };
    }, [socket, roomId, createPeerConnection, setupDataChannel]);

    const createRoom = (id) => {
        if (!socket) return;
        setStatus('creating');
        socket.emit('create-room', id);
    };

    const joinRoom = (id) => {
        if (!socket) return;
        setStatus('joining');
        socket.emit('join-room', id);
    };

    const sendFile = async (file) => {
        if (!dcRef.current || dcRef.current.readyState !== 'open') {
            setError('Data channel not open');
            return;
        }

        setIsSending(true);
        setTransferProgress(0);
        setTransferSpeed(0);

        // Send metadata
        dcRef.current.send(JSON.stringify({
            type: 'file-start',
            meta: {
                name: file.name,
                size: file.size,
                type: file.type
            }
        }));

        // Read and chunk file
        const buffer = await file.arrayBuffer();
        let offset = 0;

        lastTimeRef.current = Date.now();
        lastProgressRef.current = 0;

        // Start decoupled UI updater for sending
        window.lastBpsSync = 0;
        const uiInterval = setInterval(() => {
            if (offset > 0) {
                const progress = Math.round((offset / file.size) * 100);
                setTransferProgress(p => p !== progress ? progress : p);

                const now = Date.now();
                const timeDiff = (now - lastTimeRef.current) / 1000;
                if (timeDiff >= 0.25) {
                    const bytesSinceLast = offset - window.lastBpsSync;
                    setTransferSpeed(bytesSinceLast / timeDiff);
                    lastTimeRef.current = now;
                    window.lastBpsSync = offset;
                }
            }
        }, 250);

        const sendChunk = () => {
            try {
                // Tight loop: absolutely zero UI or React logic here. Pure ArrayBuffer crunching.
                while (offset < file.size) {
                    if (dcRef.current.bufferedAmount >= MAX_BUFFER_SIZE) {
                        dcRef.current.onbufferedamountlow = () => {
                            dcRef.current.onbufferedamountlow = null;
                            sendChunk();
                        };
                        return;
                    }

                    // Use Uint8Array view instead of ArrayBuffer.slice() to prevent massive memory copying & GC freezes
                    const chunkLength = Math.min(CHUNK_SIZE, file.size - offset);
                    const chunk = new Uint8Array(buffer, offset, chunkLength);
                    dcRef.current.send(chunk);
                    offset += chunkLength;
                }

                if (offset >= file.size) {
                    clearInterval(uiInterval);
                    dcRef.current.send(JSON.stringify({ type: 'file-end' }));
                    setIsSending(false);
                    setTransferProgress(100);
                    setTimeout(() => setTransferProgress(0), 3000);
                }
            } catch (err) {
                console.error("Transfer error:", err);
                setError("Transfer halted: " + err.message);
                clearInterval(uiInterval);
                setIsSending(false);
            }
        };

        dcRef.current.bufferedAmountLowThreshold = MAX_BUFFER_SIZE / 2;
        sendChunk();
    };

    return {
        status,
        roomId,
        error,
        createRoom,
        joinRoom,
        sendFile,
        isReceiving,
        isSending,
        transferProgress,
        transferSpeed,
        incomingFileInfo,
        isSocketReady,
        resetError: () => setError('')
    };
}
