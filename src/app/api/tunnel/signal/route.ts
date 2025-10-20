import { NextRequest, NextResponse } from 'next/server';
import { getTunnel, setTunnel } from '@/lib/tunnel-storage';

export async function POST(request: NextRequest) {
  try {
    const { code, signal, from, to } = await request.json();
    
    if (!code || !signal || !from || !to) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const tunnel = getTunnel(code.toUpperCase());
    
    if (!tunnel) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tunnel not found' 
      }, { status: 404 });
    }

    // Store the signal for the recipient to poll
    if (!tunnel.signals) {
      tunnel.signals = [];
    }
    
    tunnel.signals.push({
      signal,
      from,
      to,
      timestamp: Date.now()
    });

    setTunnel(code.toUpperCase(), tunnel);

    return NextResponse.json({ 
      success: true 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send signal' 
    }, { status: 500 });
  }
}
