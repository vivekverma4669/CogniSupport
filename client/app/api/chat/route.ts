import { NextRequest } from 'next/server';
import openai, { SYSTEM_PROMPT } from '@/lib/openai';
import { connectDB } from '@/lib/mongodb';
import Session from '@/lib/models/Session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body as { message: string; sessionId?: string };

    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();

    let session = sessionId ? await Session.findById(sessionId).catch(() => null) : null;

    if (!session) {
      session = await Session.create({
        title: message.slice(0, 60).trim(),
        messages: [],
      });
    }

    session.messages.push({ role: 'user', content: message, timestamp: new Date() });

    const conversationHistory = session.messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })
    );

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...conversationHistory],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiContent =
      completion.choices[0]?.message?.content ??
      "I'm having trouble responding right now. Please contact support@cognisupport.com for immediate help.";

    session.messages.push({ role: 'assistant', content: aiContent, timestamp: new Date() });
    await session.save();

    return Response.json({ message: aiContent, sessionId: session._id.toString() });
  } catch (error) {
    console.error('[/api/chat]', error);
    return Response.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}
