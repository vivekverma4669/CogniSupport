import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Session from '@/lib/models/Session';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    await connectDB();
    const session = await Session.findById(id).lean();

    if (!session) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    return Response.json(session);
  } catch (error) {
    console.error('[/api/sessions/[id]]', error);
    return Response.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    await connectDB();
    await Session.findByIdAndDelete(id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('[/api/sessions/[id] DELETE]', error);
    return Response.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
