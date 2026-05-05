import { connectDB } from '@/lib/mongodb';
import Session from '@/lib/models/Session';

export async function GET() {
  try {
    await connectDB();
    const sessions = await Session.find({}, { title: 1, createdAt: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    return Response.json(sessions);
  } catch (error) {
    console.error('[/api/sessions]', error);
    return Response.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}
