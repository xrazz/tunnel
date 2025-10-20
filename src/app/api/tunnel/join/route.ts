import { NextRequest, NextResponse } from 'next/server';
import { getTunnel, setTunnel } from '@/lib/tunnel-storage';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tunnel code is required' 
      }, { status: 400 });
    }

    const tunnel = getTunnel(code.toUpperCase());
    
    if (!tunnel) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tunnel not found' 
      }, { status: 404 });
    }

    if (tunnel.joiner) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tunnel already full' 
      }, { status: 409 });
    }

    const joinerId = `joiner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    tunnel.joiner = joinerId;
    
    setTunnel(code.toUpperCase(), tunnel);

    return NextResponse.json({ 
      success: true, 
      peerId: tunnel.creator,
      joinerId 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to join tunnel' 
    }, { status: 500 });
  }
}
