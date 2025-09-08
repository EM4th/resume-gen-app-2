import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: "API is working",
    endpoint: "test-minimal",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function POST() {
  return NextResponse.json({
    status: "POST to test-minimal working",
    timestamp: new Date().toISOString(),
    message: "This confirms the minimal API endpoints are accessible"
  });
}
