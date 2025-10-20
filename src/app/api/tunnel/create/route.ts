import { NextRequest, NextResponse } from 'next/server';
import { generateCode, setTunnel, Tunnel } from '@/lib/tunnel-storage';

export async function POST(request: NextRequest) {
  try {
    const code = generateCode();
    const tunnelId = `tunnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tunnel: Tunnel = {
      id: tunnelId,
      creator: tunnelId,
      joiner: null,
      createdAt: Date.now(),
      signals: []
    };
    
    setTunnel(code, tunnel);

    return NextResponse.json({ 
      success: true, 
      code,
      tunnelId 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create tunnel' 
    }, { status: 500 });
  }
}
