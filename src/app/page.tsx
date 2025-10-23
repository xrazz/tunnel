'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Github } from 'lucide-react';

// Type definitions
type ConnectionState = 'idle' | 'creating' | 'created' | 'joining' | 'connected';

type FileTransfer = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'sending' | 'receiving' | 'completed';
  direction: 'send' | 'receive';
  startTime?: number;
  speed?: number;
};

// Utility: Format transfer speed for display
const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

// Utility: Get MIME type from filename
const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'mp4': 'video/mp4',
    'zip': 'application/zip'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

export default function Home() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [tunnelCode, setTunnelCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState<FileTransfer[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const tunnelCodeRef = useRef<string>('');

  useEffect(() => {
    socketRef.current = io({ transports: ['websocket', 'polling'] });
    
    socketRef.current.on('peer-joined', async ({ peerId }: { peerId: string }) => {
      await createOffer(peerId);
    });

    socketRef.current.on('signal', async ({ signal, from }: { signal: any; from: string }) => {
      if (!peerConnectionRef.current) await setupPeerConnection(from);
      
      if (signal.type === 'offer') {
        await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(signal));
        if (pendingCandidatesRef.current.length > 0) {
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current!.addIceCandidate(candidate);
          }
          pendingCandidatesRef.current = [];
        }
        const answer = await peerConnectionRef.current!.createAnswer();
        await peerConnectionRef.current!.setLocalDescription(answer);
        socketRef.current!.emit('signal', { code: tunnelCodeRef.current, signal: answer, to: from });
      } else if (signal.type === 'answer') {
        await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(signal));
        if (pendingCandidatesRef.current.length > 0) {
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current!.addIceCandidate(candidate);
          }
          pendingCandidatesRef.current = [];
        }
      } else if (signal.candidate) {
        try {
          const candidate = new RTCIceCandidate(signal.candidate);
          if (peerConnectionRef.current?.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(candidate);
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        } catch (e) {
          console.error('Error adding ICE candidate:', e);
        }
      }
    });

    socketRef.current.on('peer-disconnected', () => {
      setState('idle');
      setTunnelCode('');
      tunnelCodeRef.current = '';
      setError('Peer disconnected');
      cleanup();
    });

    return () => {
      socketRef.current?.disconnect();
      cleanup();
    };
  }, []);

  const cleanup = () => {
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];
  };

  // Setup WebRTC peer connection with STUN/TURN servers
  const setupPeerConnection = async (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        // STUN servers help discover your public IP address
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // TURN servers relay traffic when direct connection fails
        // (e.g., different ISPs, strict firewalls)
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceTransportPolicy: 'all', // Try all connection methods
      bundlePolicy: 'max-bundle', // Bundle media for better performance
      rtcpMuxPolicy: 'require', // Multiplex RTP and RTCP
      iceCandidatePoolSize: 10 // Pre-gather ICE candidates
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Debug: Log connection type
        console.log('ICE Candidate:', event.candidate.type, event.candidate.candidate);
        socketRef.current!.emit('signal', { 
          code: tunnelCodeRef.current, 
          signal: { candidate: event.candidate }, 
          to: peerId 
        });
      }
    };

    // Debug: Log connection state changes
    pc.onconnectionstatechange = () => {
      console.log('Connection State:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        console.error('Connection failed! Check TURN servers or network.');
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', pc.iceConnectionState);
    };

    pc.ondatachannel = (event) => {
      setupDataChannel(event.channel);
    };

    peerConnectionRef.current = pc;
  };

  const createOffer = async (peerId: string) => {
    await setupPeerConnection(peerId);
    const dataChannel = peerConnectionRef.current!.createDataChannel('fileTransfer');
    setupDataChannel(dataChannel);
    const offer = await peerConnectionRef.current!.createOffer();
    await peerConnectionRef.current!.setLocalDescription(offer);
    socketRef.current!.emit('signal', { code: tunnelCodeRef.current, signal: offer, to: peerId });
  };

  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
    
    let receivedData: ArrayBuffer[] = [];
    let fileMetadata: { id: string; name: string; size: number } | null = null;
    let receivedSize = 0;
    let lastProgressUpdate = Date.now();

    channel.onopen = () => {
      setState('connected');
      setError('');
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const metadata = JSON.parse(event.data);
        fileMetadata = metadata;
        receivedData = [];
        receivedSize = 0;
        lastProgressUpdate = Date.now();
        
        setFiles(prev => [...prev, {
          id: metadata.id,
          name: metadata.name,
          size: metadata.size,
          progress: 0,
          status: 'receiving',
          direction: 'receive',
          startTime: Date.now(),
          speed: 0
        }]);
      } else if (event.data instanceof ArrayBuffer) {
        if (!fileMetadata) return;
        
        receivedData.push(event.data);
        receivedSize += event.data.byteLength;
        
        const fileId = fileMetadata.id;
        const now = Date.now();
        
        // Update UI every 300ms for max performance
        if (now - lastProgressUpdate >= 300 || receivedSize >= fileMetadata.size) {
          const progress = Math.min((receivedSize / fileMetadata.size) * 100, 100);
          
          setFiles(prev => prev.map(f => {
            if (f.id === fileId && f.startTime) {
              const elapsed = (now - f.startTime) / 1000;
              const speed = elapsed > 0 ? receivedSize / elapsed : 0;
              return { ...f, progress, speed };
            }
            return f.id === fileId ? { ...f, progress } : f;
          }));
          lastProgressUpdate = now;
        }
        
        if (receivedSize >= fileMetadata.size) {
          const mimeType = getMimeType(fileMetadata.name);
          const blob = new Blob(receivedData, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileMetadata.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
          ));
          
          fileMetadata = null;
          receivedData = [];
          receivedSize = 0;
        }
      }
    };

    channel.onclose = () => {
      setState('idle');
      setTunnelCode('');
    };

    channel.onerror = (error) => {
      console.error('Data channel error:', error);
    };
  };

  const handleCreateTunnel = () => {
    setState('creating');
    setError('');
    socketRef.current!.emit('create-tunnel', ({ code }: { code: string }) => {
      setTunnelCode(code);
      tunnelCodeRef.current = code;
      setState('created');
    });
  };

  const handleJoinTunnel = () => {
    if (!inputCode.trim()) {
      setError('Please enter a tunnel code');
      return;
    }
    setState('joining');
    setError('');
    const codeToJoin = inputCode.toUpperCase().trim();
    socketRef.current!.emit('join-tunnel', { code: codeToJoin }, async (response: any) => {
      if (response.success) {
        setTunnelCode(codeToJoin);
        tunnelCodeRef.current = codeToJoin;
        await setupPeerConnection(response.peerId);
        setState('connected');
      } else {
        setError(response.error);
        setState('idle');
      }
    });
  };

  const sendFile = (file: File, channel: RTCDataChannel) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const metadata = { id: fileId, name: file.name, size: file.size };

    const startTime = Date.now();
    setFiles(prev => [...prev, {
      id: fileId,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'sending',
      direction: 'send',
      startTime,
      speed: 0
    }]);

    channel.send(JSON.stringify(metadata));

    // Adaptive chunk size: smaller for large files (better for mobile/slow networks)
    const chunkSize = file.size > 50000000 ? 65536 : 131072; // 64KB vs 128KB
    const maxBuffer = chunkSize * 16; // 2MB buffer prevents queue overflow
    let offset = 0;
    let lastProgressUpdate = Date.now();

    const readSlice = () => {
      // Wait if buffer is full (prevents "RTCDataChannel send queue is full" error)
      if (channel.bufferedAmount > maxBuffer) {
        setTimeout(readSlice, 5);
        return;
      }

      const slice = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result && channel.readyState === 'open') {
          try {
            channel.send(e.target.result as ArrayBuffer);
            offset += chunkSize;
            
            // Update UI every 300ms instead of every chunk for max speed
            const now = Date.now();
            if (now - lastProgressUpdate >= 300 || offset >= file.size) {
              const progress = Math.min((offset / file.size) * 100, 100);
              const elapsed = (now - startTime) / 1000;
              const speed = elapsed > 0 ? offset / elapsed : 0;
              
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { ...f, progress, speed } : f
              ));
              lastProgressUpdate = now;
            }

            if (offset < file.size) {
              readSlice(); // Continue immediately
            } else {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
              ));
            }
          } catch (error) {
            // Buffer overflow - wait and retry
            console.error('Send buffer full, waiting...', error);
            setTimeout(readSlice, 50);
          }
        }
      };
      
      reader.readAsArrayBuffer(slice);
    };

    readSlice();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !dataChannelRef.current) return;
    
    // Send all selected files with small delay between each
    Array.from(selectedFiles).forEach((file, index) => {
      setTimeout(() => {
        if (dataChannelRef.current) {
          sendFile(file, dataChannelRef.current);
        }
      }, index * 100); // 100ms delay between each file start
    });
    
    // Reset file input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-16" style={{ backgroundColor: '#141414' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="flex items-center justify-center w-full">
              <h1 className="text-6xl font-bold text-white font-jersey10">
                TUNNEL
              </h1>
            </div>
          </div>
          <p className="text-sm font-medium uppercase" style={{ color: 'var(--muted)' }}>
            Peer-to-peer file sharing
          </p>
        </div>

        <div className="border p-8" style={{ backgroundColor: '#141414', borderColor: 'var(--border)' }}>
          {state === 'idle' && (
            <div className="space-y-4">
              <button onClick={handleCreateTunnel} className="w-full py-3 px-4 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#fff', color: '#141414' }}>
                Create Tunnel
              </button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ backgroundColor: '#141414', color: 'var(--muted)' }}>Or</span>
                </div>
              </div>
              <div className="space-y-3">
                <input type="text" placeholder="Enter tunnel code" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())} maxLength={5} className="w-full py-3 px-4 rounded-lg border text-center text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ borderColor: 'var(--border)', color: 'var(--text)', backgroundColor: 'transparent' }} />
                <button onClick={handleJoinTunnel} className="w-full py-3 px-4 rounded-lg border font-medium transition-colors" style={{ borderColor: 'var(--border)', color: '#fff', backgroundColor: 'var(--filler)' }}>
                  Join Tunnel
                </button>
              </div>
            </div>
          )}

          {state === 'created' && (
            <div className="text-center space-y-6">
              <div>
                <p className="text-xs font-medium uppercase mb-3" style={{ color: 'var(--muted)' }}>Share this code with your peer</p>
                <div className="text-5xl font-bold font-mono tracking-wider py-6 rounded-lg" style={{ backgroundColor: 'var(--filler)', color: 'var(--foreground)' }}>{tunnelCode}</div>
              </div>
              <p className="text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>Waiting for peer to join<span className="inline-block ml-1 h-2 w-2 animate-spin rounded-full border border-current border-r-transparent"></span></p>
            </div>
          )}

          {(state === 'creating' || state === 'joining') && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ color: 'var(--muted)' }}></div>
              <p className="mt-4 text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>{state === 'creating' ? 'Creating tunnel...' : 'Joining tunnel...'}</p>
            </div>
          )}

          {state === 'connected' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#d4edda', color: '#155724' }}>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium uppercase">Connected</span>
                </div>
                {tunnelCode && <p className="mt-2 text-xs font-medium uppercase font-mono" style={{ color: 'var(--muted)' }}>Tunnel: {tunnelCode}</p>}
              </div>
              <div>
                <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" multiple />
                <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 px-4 rounded-lg font-medium transition-colors" style={{ backgroundColor: '#fff', color: '#141414' }}>
                  Send Files
                </button>
              </div>
              {files.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase" style={{ color: 'var(--text)' }}>File Transfers</p>
                  {files.map((file) => (
                    <div key={file.id} className="p-3 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: 'var(--text)' }}>{file.name}</p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
                            {file.status === 'sending' && (<>Sending{file.speed && file.speed > 0 ? ` • ${formatSpeed(file.speed)}` : '...'}</>)}
                            {file.status === 'receiving' && (<>Receiving{file.speed && file.speed > 0 ? ` • ${formatSpeed(file.speed)}` : '...'}</>)}
                            {file.status === 'completed' && (file.direction === 'send' ? 'Sent ✓' : 'Received ✓')}
                          </p>
                        </div>
                        <span className="text-xs font-medium ml-2" style={{ color: 'var(--muted)' }}>{file.status === 'completed' ? '100%' : `${Math.round(file.progress)}%`}</span>
                      </div>
                      {(file.status === 'sending' || file.status === 'receiving') && (
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--filler)' }}>
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${file.progress}%`, backgroundColor: file.status === 'sending' ? '#0066cc' : 'var(--foreground)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>{error}</div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs uppercase mb-2" style={{ color: 'var(--muted)' }}>Open source • Peer-to-peer • No server storage</p>
          <a href="https://github.com/xrazz/tunnel" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm hover:underline" style={{ color: 'var(--muted)' }}>
            <Github size={16} />Contribute
          </a>
        </div>
      </div>
    </div>
  );
}
