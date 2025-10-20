import fs from 'fs';
import path from 'path';

const TUNNELS_FILE = path.join(process.cwd(), 'tunnels.json');

// Simple file-based storage for tunnels
export const activeTunnels = new Map();

// Load tunnels from file
function loadTunnels() {
  try {
    if (fs.existsSync(TUNNELS_FILE)) {
      const data = fs.readFileSync(TUNNELS_FILE, 'utf8');
      const tunnels = JSON.parse(data);
      activeTunnels.clear();
      for (const [code, tunnel] of Object.entries(tunnels)) {
        activeTunnels.set(code, tunnel);
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

export function setTunnel(code: string, tunnel: any) {
  activeTunnels.set(code, tunnel);
  saveTunnels();
}

export function getTunnel(code: string) {
  return activeTunnels.get(code);
}

export function deleteTunnel(code: string) {
  activeTunnels.delete(code);
  saveTunnels();
}