import { NextResponse } from 'next/server';

export async function GET() {
  // Your student GET logic here
  return NextResponse.json({ message: 'Student API endpoint' });
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Your student POST logic here
    return NextResponse.json({ message: 'Student created', data });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
}
