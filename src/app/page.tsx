'use client';

import { useEffect, useState, useRef } from 'react';
import { Github } from 'lucide-react';

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

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    'txt': 'text/plain',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'json': 'application/json',
    'xml': 'application/xml',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'md': 'text/markdown'
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
};

export default function Home() {
  const [state, setState] = useState<ConnectionState>('idle');
  const [tunnelCode, setTunnelCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [files, setFiles] = useState<FileTransfer[]>([]);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const tunnelCodeRef = useRef<string>('');
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const peerIdRef = useRef<string>('');

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    dataChannelRef.current?.close();
    peerConnectionRef.current?.close();
    dataChannelRef.current = null;
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];
  };

  const startPolling = (code: string, peerId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/tunnel/poll?code=${code}&peerId=${peerId}`);
        const data = await response.json();
        
        if (data.success && data.signals.length > 0) {
          for (const signalData of data.signals) {
            await handleSignal(signalData);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000);
  };

  const handleSignal = async ({ signal, from }: { signal: any; from: string }) => {
    if (!peerConnectionRef.current) {
      await setupPeerConnection(from);
    }

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
      await sendSignal(tunnelCodeRef.current, answer, from);
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
  };

  const sendSignal = async (code: string, signal: any, to: string) => {
    try {
      await fetch('/api/tunnel/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          signal,
          from: peerIdRef.current,
          to
        })
      });
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  };

  const setupPeerConnection = async (peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(tunnelCodeRef.current, { candidate: event.candidate }, peerId);
      }
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
    
    await sendSignal(tunnelCodeRef.current, offer, peerId);
  };

  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannelRef.current = channel;
    
    let receivedData: ArrayBuffer[] = [];
    let fileMetadata: { name: string; size: number; id: string } | null = null;
    let receivedSize = 0;

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

        const progress = (receivedSize / fileMetadata.size) * 100;
        const currentFileId = fileMetadata.id;
        
        setFiles(prev => prev.map(f => {
          if (f.id === currentFileId && f.startTime) {
            const elapsed = (Date.now() - f.startTime) / 1000;
            const speed = elapsed > 0 ? receivedSize / elapsed : 0;
            return { ...f, progress, speed };
          }
          return f.id === currentFileId ? { ...f, progress } : f;
        }));

        if (receivedSize >= fileMetadata.size) {
          const mimeType = getMimeType(fileMetadata.name);
          const blob = new Blob(receivedData, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileMetadata.name;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);

          setFiles(prev => prev.map(f => 
            f.id === currentFileId ? { ...f, status: 'completed', progress: 100 } : f
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

  const handleCreateTunnel = async () => {
    setState('creating');
    setError('');
    
    try {
      const response = await fetch('/api/tunnel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTunnelCode(data.code);
        tunnelCodeRef.current = data.code;
        peerIdRef.current = data.tunnelId;
        setState('created');
        
        // Start polling for peer joins
        startPolling(data.code, data.tunnelId);
      } else {
        setError(data.error || 'Failed to create tunnel');
        setState('idle');
      }
    } catch (error) {
      setError('Failed to create tunnel');
      setState('idle');
    }
  };

  const handleJoinTunnel = async () => {
    if (!inputCode.trim()) {
      setError('Please enter a tunnel code');
      return;
    }
    
    setState('joining');
    setError('');
    
    const codeToJoin = inputCode.toUpperCase().trim();
    
    try {
      const response = await fetch('/api/tunnel/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToJoin })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTunnelCode(codeToJoin);
        tunnelCodeRef.current = codeToJoin;
        peerIdRef.current = data.joinerId;
        await setupPeerConnection(data.peerId);
        
        // Start polling for signals
        startPolling(codeToJoin, data.joinerId);
        
        // Create offer to initiate connection
        await createOffer(data.peerId);
      } else {
        setError(data.error);
        setState('idle');
      }
    } catch (error) {
      setError('Failed to join tunnel');
      setState('idle');
    }
  };

  const sendFile = (file: File, channel: RTCDataChannel) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    const metadata = {
      id: fileId,
      name: file.name,
      size: file.size
    };

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

    const chunkSize = 16384;
    const maxBufferSize = 16384 * 64;
    let offset = 0;
    let lastUpdate = startTime;
    let lastOffset = 0;

    const sendChunk = () => {
      if (offset >= file.size) {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
        ));
        return;
      }

      if (channel.bufferedAmount > maxBufferSize) {
        channel.addEventListener('bufferedamountlow', sendChunk, { once: true });
        return;
      }

      const slice = file.slice(offset, offset + chunkSize);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result;
        if (result instanceof ArrayBuffer && channel.readyState === 'open') {
          channel.send(result);
          offset += chunkSize;
          
          const now = Date.now();
          const timeDiff = (now - lastUpdate) / 1000;
          const bytesDiff = offset - lastOffset;
          
          if (timeDiff >= 0.5) {
            const speed = bytesDiff / timeDiff;
            lastUpdate = now;
            lastOffset = offset;
            
            const progress = Math.min((offset / file.size) * 100, 100);
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, progress, speed } : f
            ));
          } else {
            const progress = Math.min((offset / file.size) * 100, 100);
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, progress } : f
            ));
          }
          
          sendChunk();
        }
      };
      
      reader.readAsArrayBuffer(slice);
    };

    channel.bufferedAmountLowThreshold = maxBufferSize / 2;
    sendChunk();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dataChannelRef.current) return;

    sendFile(file, dataChannelRef.current);
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-16" style={{ backgroundColor: '#fff' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="bg-black text-white px-4 py-2 font-bold text-3xl flex items-center gap-3">
              <img src="/logo.png" alt="Tunnel Logo" className="h-12 w-12 brightness-0 invert" />
              TUNNEL
            </div>
          </div>
          <p className="text-base font-medium" style={{ color: 'var(--muted)' }}>
            Peer-to-peer file sharing
          </p>
        </div>

        <div className="border p-8" style={{ backgroundColor: '#fff', borderColor: 'var(--border)' }}>
          {state === 'idle' && (
            <div className="space-y-4">
              <button
                onClick={handleCreateTunnel}
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                style={{ 
                  backgroundColor: 'var(--foreground)', 
                  color: '#fff'
                }}
              >
                Create Tunnel
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'var(--border)' }}></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2" style={{ backgroundColor: '#fff', color: 'var(--muted)' }}>
                    Or
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter tunnel code"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  maxLength={5}
                  className="w-full py-3 px-4 rounded-lg border text-center text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    backgroundColor: 'var(--filler)'
                  }}
                />
                <button
                  onClick={handleJoinTunnel}
                  className="w-full py-3 px-4 rounded-lg border font-medium transition-colors"
                  style={{ 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                >
                  Join Tunnel
                </button>
              </div>
            </div>
          )}

          {state === 'created' && (
            <div className="text-center space-y-6">
              <div>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--muted)' }}>
                  Share this code with your peer
                </p>
                <div 
                  className="text-5xl font-bold font-mono tracking-wider py-6 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--filler)',
                    color: 'var(--foreground)'
                  }}
                >
                  {tunnelCode}
                </div>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                Waiting for peer to join...
              </p>
            </div>
          )}

          {(state === 'creating' || state === 'joining') && (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" style={{ color: 'var(--muted)' }}></div>
              <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
                {state === 'creating' ? 'Creating tunnel...' : 'Joining tunnel...'}
              </p>
            </div>
          )}

          {state === 'connected' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: '#d4edda', color: '#155724' }}>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Connected</span>
                </div>
                {tunnelCode && (
                  <p className="mt-2 text-sm font-mono" style={{ color: 'var(--muted)' }}>
                    Tunnel: {tunnelCode}
                  </p>
                )}
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                  style={{ 
                    backgroundColor: 'var(--foreground)',
                    color: '#fff'
                  }}
                >
                  Send File
                </button>
              </div>

              {files.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    File Transfers
                  </p>
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="p-3 rounded-lg border"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                            {file.name}
                          </p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
                            {file.status === 'sending' && (
                              <>Sending{file.speed && file.speed > 0 ? ` • ${formatSpeed(file.speed)}` : '...'}</>
                            )}
                            {file.status === 'receiving' && (
                              <>Receiving{file.speed && file.speed > 0 ? ` • ${formatSpeed(file.speed)}` : '...'}</>
                            )}
                            {file.status === 'completed' && (file.direction === 'send' ? 'Sent ✓' : 'Received ✓')}
                          </p>
                        </div>
                        <span className="text-xs font-medium ml-2" style={{ color: 'var(--muted)' }}>
                          {file.status === 'completed' ? '100%' : `${Math.round(file.progress)}%`}
                        </span>
                      </div>
                      {(file.status === 'sending' || file.status === 'receiving') && (
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--filler)' }}>
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${file.progress}%`,
                              backgroundColor: file.status === 'sending' ? '#0066cc' : 'var(--foreground)'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg text-sm text-center" style={{ backgroundColor: '#f8d7da', color: '#721c24' }}>
              {error}
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
            Open source • Peer-to-peer • No server storage
          </p>
          <a 
            href="https://github.com/xrazz/tunnel" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm hover:underline"
            style={{ color: 'var(--muted)' }}
          >
            <Github size={16} />
            Contribute
          </a>
        </div>
      </div>
    </div>
  );
}
