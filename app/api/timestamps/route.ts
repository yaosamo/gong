import { NextRequest, NextResponse } from 'next/server';

// Store timestamps in memory (in production, use a database)
let timestamps: Array<{
  id: string;
  time: string;
  location: string;
  x: number;
  y: number;
  timestamp: number;
}> = [];

// Clean up old timestamps older than 24 hours
setInterval(() => {
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  
  timestamps = timestamps.filter(t => t.timestamp > oneDayAgo);
}, 60 * 60 * 1000); // Check every hour

export async function GET() {
  // Return all timestamps
  return NextResponse.json({ timestamps });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newTimestamp = {
      id: body.id,
      time: body.time,
      location: body.location,
      x: body.x,
      y: body.y,
      timestamp: Date.now()
    };
    
    timestamps.push(newTimestamp);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: {
        id: newTimestamp.id,
        time: newTimestamp.time,
        location: newTimestamp.location,
        x: newTimestamp.x,
        y: newTimestamp.y
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

