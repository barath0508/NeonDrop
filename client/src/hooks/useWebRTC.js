import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const CHUNK_SIZE = 256 * 1024; // 256KB chunks
const MAX_BUFFER_SIZE = 8 * 1024 * 1024; // 8MB buffer limit

export function useWebRTC() {
    const [socket, setSocket] = useState(null);
    const [peerConnection, setPeerConnection] = useState(null);
    const [dataChannel, setDataChannel] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState('');

    // File Transfer State
    const [isSocketReady, setIsSocketReady] = useState(false);
    const [incomingFileInfo, setIncomingFileInfo] = useState(null);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferSpeed, setTransferSpeed] = useState(0);
    const [isReceiving, setIsReceiving] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Multi-file queue state
    const [fileQueue, setFileQueue] = useState([]);
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
    const [totalQueueLength, setTotalQueueLength] = useState(0);

    // Transfer history: { id, name, size, type, direction: 'sent'|'received', timestamp, blobUrl? }
    const [transferHistory, setTransferHistory] = useState([]);

    const pcRef = useRef(null);
    const dcRef = useRef(null);
    const socketRef = useRef(null);
    const fileQueueRef = useRef([]);
    const isSendingRef = useRef(false);

    // Speed metrics
    const lastProgressRef = useRef(0);
    const lastTimeRef = useRef(Date.now());

    useEffect(() => {
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
                { urls: 'stun:stun.cloudflare.com:3478' }
            ],
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
                setTimeout(() => {
                    if (pcRef.current && pcRef.current.connectionState === 'disconnected') {
                        setStatus('disconnected');
                        setError('Peer disconnected');
                    }
                }, 10000);
            }
        };

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

        let receivedSize = 0;
        let fileBuffer = [];
        let currentMetadata = null;
        let t0 = Date.now();

        channel.onmessage = (event) => {
            if (typeof event.data === 'string') {
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
                    // Reassemble and download with the correct MIME type preserved
                    const blob = new Blob(fileBuffer, { type: currentMetadata.type || 'application/octet-stream' });
                    const blobUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = currentMetadata.name;
                    a.click();

                    // Add to history
                    setTransferHistory(prev => [{
                        id: Date.now(),
                        name: currentMetadata.name,
                        size: currentMetadata.size,
                        type: currentMetadata.type,
                        direction: 'received',
                        timestamp: new Date().toLocaleTimeString(),
                        blobUrl
                    }, ...prev]);

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
                    lastProgressRef.current = receivedSize;
                }
            }
        };

        // Decoupled UI Updater Interval (4 times/second)
        const uiInterval = setInterval(() => {
            if (currentMetadata && lastProgressRef.current > 0) {
                const currentReceived = lastProgressRef.current;
                const progress = Math.round((currentReceived / currentMetadata.size) * 100);
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

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('room-created', (id) => {
            setRoomId(id);
            setStatus('waiting');
        });

        socket.on('room-joined', async (id) => {
            setRoomId(id);
            setStatus('connecting');
        });

        socket.on('peer-joined', async (peerId) => {
            setStatus('connecting');
            const pc = createPeerConnection(roomId);

            const dc = pc.createDataChannel('fileTransfer', { ordered: true });
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

    // Core single-file send (internal)
    const sendSingleFile = async (file, queueIndex, totalFiles) => {
        if (!dcRef.current || dcRef.current.readyState !== 'open') {
            setError('Data channel not open');
            return;
        }

        isSendingRef.current = true;
        setIsSending(true);
        setTransferProgress(0);
        setTransferSpeed(0);
        setCurrentQueueIndex(queueIndex + 1);

        // Send metadata with MIME type
        dcRef.current.send(JSON.stringify({
            type: 'file-start',
            meta: { name: file.name, size: file.size, type: file.type || 'application/octet-stream' }
        }));

        const buffer = await file.arrayBuffer();
        let offset = 0;

        lastTimeRef.current = Date.now();
        lastProgressRef.current = 0;
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

        await new Promise((resolve) => {
            const sendChunk = () => {
                try {
                    while (offset < file.size) {
                        if (dcRef.current.bufferedAmount >= MAX_BUFFER_SIZE) {
                            dcRef.current.onbufferedamountlow = () => {
                                dcRef.current.onbufferedamountlow = null;
                                sendChunk();
                            };
                            return;
                        }
                        const chunkLength = Math.min(CHUNK_SIZE, file.size - offset);
                        const chunk = new Uint8Array(buffer, offset, chunkLength);
                        dcRef.current.send(chunk);
                        offset += chunkLength;
                    }

                    clearInterval(uiInterval);
                    dcRef.current.send(JSON.stringify({ type: 'file-end' }));
                    setTransferProgress(100);

                    // Add to transfer history
                    setTransferHistory(prev => [{
                        id: Date.now(),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        direction: 'sent',
                        timestamp: new Date().toLocaleTimeString()
                    }, ...prev]);

                    resolve();
                } catch (err) {
                    console.error('Transfer error:', err);
                    setError('Transfer halted: ' + err.message);
                    clearInterval(uiInterval);
                    resolve();
                }
            };

            dcRef.current.bufferedAmountLowThreshold = MAX_BUFFER_SIZE / 2;
            sendChunk();
        });
    };

    // Public: send a queue of files one-by-one
    const sendFiles = async (files) => {
        const fileArray = Array.from(files);
        if (!fileArray.length) return;

        setFileQueue(fileArray);
        setTotalQueueLength(fileArray.length);
        setCurrentQueueIndex(0);

        for (let i = 0; i < fileArray.length; i++) {
            await sendSingleFile(fileArray[i], i, fileArray.length);
            // Small pause between files to let the receiver process
            if (i < fileArray.length - 1) {
                await new Promise(r => setTimeout(r, 300));
            }
        }

        isSendingRef.current = false;
        setIsSending(false);
        setFileQueue([]);
        setTimeout(() => {
            setTransferProgress(0);
            setTotalQueueLength(0);
            setCurrentQueueIndex(0);
        }, 3000);
    };

    // Legacy single-file compat
    const sendFile = (file) => sendFiles([file]);

    return {
        status, roomId, error,
        createRoom, joinRoom,
        sendFile, sendFiles,
        isReceiving, isSending,
        transferProgress, transferSpeed,
        incomingFileInfo,
        isSocketReady,
        fileQueue, currentQueueIndex, totalQueueLength,
        transferHistory,
        resetError: () => setError('')
    };
}
