import { NextRequest, NextResponse } from 'next/server';
import { getTunnel, setTunnel } from '@/lib/tunnel-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const peerId = searchParams.get('peerId');
    
    console.log('Poll request:', { code, peerId });
    
    if (!code || !peerId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    const tunnel = getTunnel(code.toUpperCase());
    
    if (!tunnel) {
      console.log('Tunnel not found:', code.toUpperCase());
      return NextResponse.json({ 
        success: false, 
        error: 'Tunnel not found' 
      }, { status: 404 });
    }

    // Find signals for this peer
    const signals = tunnel.signals?.filter(s => s.to === peerId) || [];
    
    // Clear signals after retrieving them
    if (tunnel.signals) {
      tunnel.signals = tunnel.signals.filter(s => s.to !== peerId);
      setTunnel(code.toUpperCase(), tunnel);
    }

    console.log('Returning signals:', signals.length);
    return NextResponse.json({ 
      success: true, 
      signals 
    });
  } catch (error) {
    console.error('Poll error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to get signals' 
    }, { status: 500 });
  }
}
