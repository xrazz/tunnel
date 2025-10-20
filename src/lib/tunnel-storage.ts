import fs from 'fs';
import path from 'path';

const TUNNELS_FILE = path.join(process.cwd(), 'tunnels.json');

// Types for tunnel storage
export interface TunnelSignal {
  signal: any;
  from: string;
  to: string;
  timestamp: number;
}

export interface Tunnel {
  id: string;
  creator: string;
  joiner: string | null;
  createdAt: number;
  signals: TunnelSignal[];
}

// Shared storage for tunnels across API routes
// In production, this should be replaced with Redis or a database
export const activeTunnels = new Map<string, Tunnel>();

// Load tunnels from file
function loadTunnels() {
  try {
    if (fs.existsSync(TUNNELS_FILE)) {
      const data = fs.readFileSync(TUNNELS_FILE, 'utf8');
      const tunnels = JSON.parse(data);
      activeTunnels.clear();
      for (const [code, tunnel] of Object.entries(tunnels)) {
        activeTunnels.set(code, tunnel as Tunnel);
      }
    }
  } catch (error) {
    console.error('Error loading tunnels:', error);
  }
}

// Save tunnels to file
function saveTunnels() {
  try {
    const tunnels = Object.fromEntries(activeTunnels);
    fs.writeFileSync(TUNNELS_FILE, JSON.stringify(tunnels, null, 2));
  } catch (error) {
    console.error('Error saving tunnels:', error);
  }
}

// Initialize tunnels on module load
loadTunnels();

export function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (activeTunnels.has(code)) {
    return generateCode();
  }
  return code;
}

export function setTunnel(code: string, tunnel: Tunnel) {
  activeTunnels.set(code, tunnel);
  saveTunnels();
}

export function getTunnel(code: string): Tunnel | undefined {
  return activeTunnels.get(code);
}

export function deleteTunnel(code: string) {
  activeTunnels.delete(code);
  saveTunnels();
}