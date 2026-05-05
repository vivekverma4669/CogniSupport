'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar, { type SessionSummary } from '@/components/Sidebar';
import ChatWindow, { type Message } from '@/components/ChatWindow';

export default function ChatPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) setSessions(await res.json());
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActiveSessionId(sessionId);
      setMessages(
        (data.messages ?? []).map((m: { role: string; content: string; timestamp: string }) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: m.timestamp,
        }))
      );
    } catch {
      setMessages([
        {
          role: 'assistant',
          content: 'Sorry, I could not load that conversation. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) handleNewChat();
    } catch {
      // non-critical
    }
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, sessionId: activeSessionId }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Unknown error');

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message, timestamp: new Date().toISOString() },
      ]);
      setActiveSessionId(data.sessionId);
      fetchSessions();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm sorry, I'm having trouble responding right now. Please try again, or contact our support team at support@cognisupport.com or call 1-800-COGNI-AI.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
      />
      <ChatWindow
        messages={messages}
        isTyping={isTyping}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
