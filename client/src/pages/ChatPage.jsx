import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import SwapCard from '../components/SwapCard';
import { Avatar, EmptyState, ErrorAlert, Loader, StatusBadge } from '../components/ui';
import { formatDate, timeAgo } from '../utils/format';

const POLL_MS = 4000;

function formatDayLabel(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

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
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const listRef = useRef(null);
  const lastAt = useRef(null);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
        setShowScrollBottom(false);
      }
    });
  }, []);

  function handleScroll() {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 120);
  }

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
  }, [swapId, scrollDown]);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    lastAt.current = null;
    loadAll();
  }, [loadAll]);

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
        /* silent retry on poll */
      }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [swapId, onActivity, scrollDown]);

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

  if (loading) return <Loader label="Opening chat conversation…" />;
  if (error) return <ErrorAlert error={error} onRetry={loadAll} />;

  const other = swap.direction === 'incoming' ? swap.requester : swap.owner;

  // Group messages with day dividers
  let lastDay = '';

  return (
    <div className="rw-chat-panel position-relative">
      {/* Chat Header with Back Button */}
      <header className="rw-chat-head">
        <div className="d-flex align-items-center gap-2 min-w-0">
          <Link to="/chat" className="btn btn-sm btn-outline-dark d-md-none p-1 px-2 me-1" aria-label="Back to conversations list">
            ← Back
          </Link>
          <Avatar user={other} size={36} />
          <div className="min-w-0">
            <strong className="d-block text-truncate fs-6">{other?.name || 'Member'}</strong>
            <small className="text-muted d-block text-truncate">
              {swap.offeredListing.title} ⇄ {swap.requestedListing.title}
            </small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <StatusBadge status={swap.status} />
          <button
            type="button"
            className="btn btn-sm btn-outline-dark"
            onClick={() => setShowDetails((s) => !s)}
            aria-expanded={showDetails}
          >
            {showDetails ? 'Hide' : 'Swap'} details
          </button>
        </div>
      </header>

      {/* Collapsible Swap Details Banner */}
      {showDetails && (
        <div className="p-3 border-bottom rw-panel">
          <SwapCard swap={swap} onChange={(s) => { setSwap(s); loadAll(); }} />
        </div>
      )}

      {/* Messages Thread */}
      <div
        className="rw-chat-messages"
        ref={listRef}
        onScroll={handleScroll}
        aria-live="polite"
      >
        {messages.map((m) => {
          const day = formatDayLabel(m.createdAt);
          const showDay = day !== lastDay;
          if (showDay) lastDay = day;

          return (
            <div key={m.id} className="d-flex flex-column">
              {showDay && <div className="rw-msg-divider">{day}</div>}

              {m.kind === 'system' ? (
                <div className="rw-msg-system my-1">
                  <span>{m.body}</span>
                  <small className="opacity-75 ms-1">({formatDate(m.createdAt)})</small>
                </div>
              ) : (
                <div className={`rw-msg ${m.mine ? 'rw-msg-mine' : ''}`}>
                  <div className="rw-msg-bubble">{m.body}</div>
                  <div className="rw-msg-meta">
                    {m.mine ? 'You' : m.sender?.name} · {timeAgo(m.createdAt)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Jump to Latest Message Button */}
      {showScrollBottom && (
        <button
          type="button"
          className="btn btn-sm btn-light border shadow-sm position-absolute rounded-pill px-3"
          style={{ bottom: 75, left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}
          onClick={scrollDown}
          aria-label="Scroll to newest messages"
        >
          ↓ New messages
        </button>
      )}

      {/* Bottom Sticky Input Form */}
      {canSend ? (
        <form className="rw-chat-form" onSubmit={send}>
          <label htmlFor="chat-input" className="visually-hidden">Your message</label>
          <input
            id="chat-input"
            className="form-control"
            value={text}
            maxLength={1000}
            onChange={(e) => setText(e.target.value)}
            placeholder="Discuss item condition, local meetup spot, or shipping details…"
            autoComplete="off"
          />
          <button
            type="submit"
            className="btn btn-success"
            disabled={sending || !text.trim()}
          >
            {sending ? '…' : 'Send'}
          </button>
          {sendError && <div className="invalid-feedback d-block w-100">{sendError}</div>}
        </form>
      ) : (
        <div className="rw-chat-closed">
          This swap is {swap.status}. The conversation is now closed and read-only.
        </div>
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
      <div className="mb-3">
        <h1 className="rw-page-title mb-1">Negotiation chat</h1>
        <p className="text-muted small mb-0">
          Real-time trade discussions. Keep negotiations friendly and agree on delivery without exchanging money.
        </p>
      </div>

      <div className="rw-chat">
        {/* Left: Conversations List (Hidden on Mobile when conversation is open) */}
        <aside
          className={`rw-chat-list ${swapId ? 'd-none d-md-block' : 'd-block'}`}
          aria-label="Conversations"
        >
          {loading && <Loader small label="Loading chats…" />}
          <ErrorAlert error={error} onRetry={reload} />

          {!loading && items.length === 0 && (
            <EmptyState
              icon="💬"
              title="No active chats"
              action={
                <Link to="/listings" className="btn btn-success btn-sm mt-2">
                  Browse items to swap
                </Link>
              }
            >
              When you propose or receive a swap proposal, a private negotiation chat opens here.
            </EmptyState>
          )}

          {items.map((c) => (
            <Link
              key={c.swapId}
              to={`/chat/${c.swapId}`}
              className={`rw-chat-item ${c.swapId === swapId ? 'active' : ''}`}
            >
              <Avatar user={c.otherUser} size={38} />
              <span className="min-w-0 flex-grow-1">
                <span className="d-flex justify-content-between align-items-baseline gap-2">
                  <strong className="text-truncate">{c.otherUser?.name}</strong>
                  <small className="text-muted text-nowrap" style={{ fontSize: '0.72rem' }}>
                    {timeAgo(c.lastMessageAt)}
                  </small>
                </span>
                <small className="d-block text-truncate text-muted">
                  {c.offeredTitle} ⇄ {c.requestedTitle}
                </small>
                <small className="d-block text-truncate text-secondary">
                  {c.lastMessagePreview || 'Conversation started'}
                </small>
              </span>
              <StatusBadge status={c.status} />
            </Link>
          ))}
        </aside>

        {/* Right: Active Conversation Thread (Hidden on Mobile when no conversation is selected) */}
        <section
          className={`rw-chat-main ${swapId ? 'd-flex' : 'd-none d-md-flex'}`}
        >
          {swapId ? (
            <Conversation key={swapId} swapId={swapId} onActivity={reload} />
          ) : (
            <div className="m-auto text-center p-5">
              <span className="display-4 d-block mb-3" aria-hidden="true">💬</span>
              <h3 className="h5 fw-bold mb-2">Select a swap conversation</h3>
              <p className="text-muted mb-0">Choose a trade from the left to read messages and negotiate.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
