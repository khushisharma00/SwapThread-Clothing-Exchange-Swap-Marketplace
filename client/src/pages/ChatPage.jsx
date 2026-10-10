import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import SwapCard from '../components/SwapCard';
import { Avatar, EmptyState, ErrorAlert, Loader, StatusBadge } from '../components/ui';
import { formatDate, timeAgo } from '../utils/format';

const POLL_MS = 4000;

function Conversation({ swapId, onActivity }) {
  const [swap, setSwap] = useState(null);
  const [messages, setMessages] = useState([]);
  const [canSend, setCanSend] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const listRef = useRef(null);
  const lastAt = useRef(null);

  const scrollDown = () => requestAnimationFrame(() => listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight));

  const loadAll = useCallback(async () => {
    try {
      const data = await api.get(`/swaps/${swapId}/messages`);
      setSwap(data.swap);
      setCanSend(data.canSend);
      setMessages(data.messages);
      lastAt.current = data.messages.at(-1)?.createdAt || null;
      setError(null);
      scrollDown();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [swapId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    setMessages([]);
    lastAt.current = null;
    loadAll();
  }, [loadAll]);

  // Polling for new messages (and swap status changes)
  useEffect(() => {
    const t = setInterval(async () => {
      if (document.hidden) return;
      try {
        const data = await api.get(`/swaps/${swapId}/messages`, lastAt.current ? { after: lastAt.current } : undefined);
        setSwap(data.swap);
        setCanSend(data.canSend);
        if (data.messages.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            return [...prev, ...data.messages.filter((m) => !seen.has(m.id))];
          });
          lastAt.current = data.messages.at(-1).createdAt;
          scrollDown();
          onActivity?.();
        }
      } catch {
        /* transient network error — next poll will retry */
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [swapId, onActivity]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return setSendError('Type a message first.');
    if (body.length > 1000) return setSendError('Messages can be at most 1000 characters.');
    setSending(true);
    setSendError(null);
    try {
      const { message } = await api.post(`/swaps/${swapId}/messages`, { body });
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      lastAt.current = message.createdAt;
      setText('');
      scrollDown();
      onActivity?.();
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loader label="Loading conversation…" />;
  if (error) return <ErrorAlert error={error} onRetry={loadAll} />;

  const other = swap.direction === 'incoming' ? swap.requester : swap.owner;

  return (
    <div className="rw-chat-panel">
      <header className="rw-chat-head">
        <Link to="/chat" className="btn btn-sm btn-outline-dark d-md-none" aria-label="Back to conversations">←</Link>
        <Avatar user={other} size={38} />
        <div className="flex-grow-1 min-w-0">
          <strong>{other?.name || 'Member'}</strong>
          <div className="small text-muted text-truncate">{swap.offeredListing.title} ⇄ {swap.requestedListing.title}</div>
        </div>
        <StatusBadge status={swap.status} />
        <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => setShowDetails((s) => !s)} aria-expanded={showDetails}>
          {showDetails ? 'Hide' : 'Swap'} details
        </button>
      </header>
      {showDetails && (
        <div className="p-3 border-bottom">
          <SwapCard swap={swap} onChange={(s) => { setSwap(s); loadAll(); }} />
        </div>
      )}
      <div className="rw-chat-messages" ref={listRef} aria-live="polite">
        {messages.map((m) =>
          m.kind === 'system' ? (
            <div key={m.id} className="rw-msg-system">{m.body}<span> · {formatDate(m.createdAt)}</span></div>
          ) : (
            <div key={m.id} className={`rw-msg ${m.mine ? 'rw-msg-mine' : ''}`}>
              <div className="rw-msg-bubble">{m.body}</div>
              <div className="rw-msg-meta">{m.mine ? 'You' : m.sender?.name} · {timeAgo(m.createdAt)}</div>
            </div>
          )
        )}
      </div>
      {canSend ? (
        <form className="rw-chat-form" onSubmit={send}>
          <label htmlFor="chat-input" className="visually-hidden">Message</label>
          <input id="chat-input" className="form-control" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder="Discuss sizes, condition, meet-up spot or courier…" autoComplete="off" />
          <button type="submit" className="btn btn-success" disabled={sending || !text.trim()}>{sending ? '…' : 'Send'}</button>
          {sendError && <div className="invalid-feedback d-block w-100">{sendError}</div>}
        </form>
      ) : (
        <div className="rw-chat-closed">This swap is {swap.status}. The conversation is read-only.</div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const { swapId } = useParams();
  const { data, loading, error, reload } = useAsync(() => api.get('/conversations'), []);
  const items = data?.items || [];

  return (
    <div className="container py-4">
      <h1 className="rw-page-title">Negotiation chat</h1>
      <p className="text-muted small">Messages refresh automatically every few seconds. Never share passwords or payment details — ReWear swaps are payment-free.</p>
      <div className="rw-chat">
        <aside className={`rw-chat-list ${swapId ? 'd-none d-md-block' : ''}`} aria-label="Conversations">
          {loading && <Loader small />}
          <ErrorAlert error={error} onRetry={reload} />
          {!loading && items.length === 0 && (
            <EmptyState icon="💬" title="No conversations yet" action={<Link to="/listings" className="btn btn-success btn-sm">Find something to swap</Link>}>
              A conversation starts when you send or receive a swap request.
            </EmptyState>
          )}
          {items.map((c) => (
            <Link key={c.swapId} to={`/chat/${c.swapId}`} className={`rw-chat-item ${c.swapId === swapId ? 'active' : ''}`}>
              <Avatar user={c.otherUser} size={36} />
              <span className="min-w-0 flex-grow-1">
                <span className="d-flex justify-content-between gap-2">
                  <strong className="text-truncate">{c.otherUser?.name}</strong>
                  <small className="text-muted text-nowrap">{timeAgo(c.lastMessageAt)}</small>
                </span>
                <small className="d-block text-truncate text-muted">{c.offeredTitle} ⇄ {c.requestedTitle}</small>
                <small className="d-block text-truncate">{c.lastMessagePreview}</small>
              </span>
              <StatusBadge status={c.status} />
            </Link>
          ))}
        </aside>
        <section className={`rw-chat-main ${swapId ? '' : 'd-none d-md-flex'}`}>
          {swapId ? <Conversation key={swapId} swapId={swapId} onActivity={reload} /> : <EmptyState icon="👈" title="Select a conversation">Pick a swap on the left to read and reply.</EmptyState>}
        </section>
      </div>
    </div>
  );
}
