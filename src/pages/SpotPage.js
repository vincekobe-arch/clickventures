import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';

const BASE = '';

function mediaUrl(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return filePath;
}

const nameMap = {
  'ili-likha':           'Ili-Likha Village',
  'lourdes-grotto':      'Our Lady of Lourdes Grotto',
  'botanical-garden':    'Botanical Garden',
  'igorot-stone-kingdom':'Igorot Stone Kingdom',
  'camp-john-hay':       'Camp John Hay',
};

const descMap = {
  'ili-likha':           'A living cultural village celebrating the indigenous arts, crafts, and traditions of the Cordilleran people.',
  'lourdes-grotto':      'A sacred hilltop shrine perched above Baguio City, offering breathtaking panoramic views.',
  'botanical-garden':    'A lush sanctuary of native Cordilleran plants, flowers, and a traditional Igorot village.',
  'igorot-stone-kingdom':'An awe-inspiring cultural heritage site featuring massive stone carvings of the Igorot people.',
  'camp-john-hay':       'A historic former American military camp now transformed into a premier leisure destination.',
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');
  * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse    { 0%,100%{opacity:.1} 50%{opacity:.25} }
  @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spinReverse { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
  @keyframes dash     { to { stroke-dashoffset: -100; } }
  @keyframes modalIn  { from{opacity:0;transform:scale(0.9) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }

  .sp-back-btn {
    background: transparent; border: 1.5px solid rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.7); padding: 7px 18px; border-radius: 6px;
    font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .sp-back-btn:hover { border-color: rgba(255,255,255,0.9); color: #fff; }

  .sp-media-card {
    border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden;
    background: #fff; transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s; cursor: pointer;
  }
  .sp-media-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.15); }

  .sp-lightbox-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.88); z-index: 999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 32px; cursor: zoom-out; backdrop-filter: blur(10px);
  }
  .sp-lightbox-img { max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 8px; animation: modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards; }
@media (max-width: 768px) {
    .sp-main-grid { grid-template-columns: 1fr !important; }
    .sp-left-col { position: static !important; }
    .sp-header-inner { padding-left: 20px !important; padding-right: 20px !important; }
    .sp-content-wrap { padding-left: 20px !important; padding-right: 20px !important; }
    .sp-tab-label { display: none !important; }
    .sp-members-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .sp-swipe-hint { display: block !important; }
  }`;

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function displayName(item) {
  if (item.first_name || item.last_name)
    return [item.first_name, item.last_name].filter(Boolean).join(' ');
  return item.username || 'Unknown';
}
function Avatar({ name, size = 38 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const colors   = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
  const color    = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, letterSpacing: '-0.02em',
    }}>{initials}</div>
  );
}

// ── ReplyItem ─────────────────────────────────────────────────────────────────
function ReplyItem({ r, currentUserId, onDelete, onEdit, onReplyTo }) {
  const [editing,  setEditing]  = useState(false);
  const [editText, setEditText] = useState(r.content);
  const [saving,   setSaving]   = useState(false);
  const [replyConfirm,  setReplyConfirm]  = useState(false);
  const [replyDeleting, setReplyDeleting] = useState(false);
  const isOwner = currentUserId && String(currentUserId) === String(r.user_id);
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.username || 'Unknown';

  async function saveEdit() {
    if (!editText.trim() || editText.trim() === r.content) { setEditing(false); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('reply_id', r.id);
      fd.append('user_id',  currentUserId);
      fd.append('content',  editText.trim());
      const res = await API.post('/comments.php?action=edit_reply', fd);
      if (res.data.success) { onEdit(r.id, editText.trim()); setEditing(false); }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setReplyDeleting(true);
    try {
      const fd = new FormData();
      fd.append('reply_id', r.id);
      fd.append('user_id',  currentUserId);
      const res = await API.post('/comments.php?action=delete_reply', fd);
      if (res.data.success) onDelete(r.id);
    } finally { setReplyDeleting(false); setReplyConfirm(false); }
  }

  return (
    <div className="flex gap-1.5 items-start mt-1.5 pl-9">
      <Avatar name={name} size={22} />
      <div className="flex-1">
        <div className={`bg-gray-100 rounded-tr-lg rounded-br-lg rounded-bl-lg px-2.5 py-1.5 inline-block max-w-full ${editing ? 'w-full' : ''}`}>
          <div className="font-bold text-gray-900 mb-0.5" style={{ fontSize: '0.65rem' }}>{name}</div>
          {r.reply_to_name && (
            <div className="font-bold mb-1" style={{ fontSize: '0.62rem', color: '#6366f1' }}>↩ {r.reply_to_name}</div>
          )}
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                className="w-full border rounded-md outline-none resize-none bg-white"
                style={{ borderColor: 'rgba(0,0,0,0.15)', padding: '4px 7px', fontSize: '0.76rem', fontFamily: "'DM Sans',sans-serif" }}
              />
              <div className="flex gap-1.5">
                <button onClick={saveEdit} disabled={saving} className="bg-gray-900 text-white border-none rounded-md font-bold cursor-pointer" style={{ padding: '2px 9px', fontSize: '0.64rem', fontFamily: "'DM Sans',sans-serif" }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditText(r.content); }} className="border-none rounded-md font-bold cursor-pointer" style={{ background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.5)', padding: '2px 9px', fontSize: '0.64rem', fontFamily: "'DM Sans',sans-serif" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.76rem', color: 'rgba(0,0,0,0.68)', lineHeight: 1.45, wordBreak: 'break-word' }}>{r.content}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 pl-0.5">
          <div style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.28)' }}>{timeAgo(r.created_at)}</div>
          {currentUserId && !editing && (
            <button onClick={() => onReplyTo && onReplyTo(r.id, name)}
              className="bg-transparent border-none cursor-pointer font-bold transition-colors duration-150"
              style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.35)', fontFamily: "'DM Sans',sans-serif", padding: '1px 2px' }}
              onMouseEnter={e => e.currentTarget.style.color='#111'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.35)'}
            >Reply</button>
          )}
          {isOwner && !editing && (
            <div className="flex gap-0.5">
              <button onClick={() => setEditing(true)} title="Edit"
                className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                style={{ padding: '1px 2px', color: 'rgba(0,0,0,0.28)' }}
                onMouseEnter={e => e.currentTarget.style.color='#6366f1'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.28)'}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={() => setReplyConfirm(true)} title="Delete"
                className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                style={{ padding: '1px 2px', color: 'rgba(0,0,0,0.28)' }}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.28)'}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>

              {replyConfirm && ReactDOM.createPortal(
                <div onClick={() => setReplyConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-6"
                  style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease forwards' }}>
                  <div onClick={e => e.stopPropagation()} className="bg-white flex flex-col"
                    style={{ borderRadius:16, maxWidth:380, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.2)', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards', padding:24 }}>
                    <div className="mb-1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Delete Reply</div>
                    <p style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.5)', lineHeight:1.65, margin:'8px 0 20px' }}>
                      Are you sure you want to delete this reply? This cannot be undone.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setReplyConfirm(false)} className="border-none rounded-lg font-bold cursor-pointer"
                        style={{ background:'rgba(0,0,0,0.07)', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", color:'rgba(0,0,0,0.5)' }}>
                        Cancel
                      </button>
                      <button onClick={handleDelete} disabled={replyDeleting} className="text-white border-none rounded-lg font-bold cursor-pointer"
                        style={{ background:'#ef4444', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>
                        {replyDeleting ? 'Deleting…' : 'Yes, Delete'}
                      </button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Reply Modal ───────────────────────────────────────────────────────────────
function ReplyModal({ comment, currentUserId, onClose, onReplyAdded }) {
  const [replies,      setReplies]      = useState(comment.replies || []);
  const [visibleCount, setVisibleCount] = useState(10);
  const [replyText,    setReplyText]    = useState('');
  const [replyingTo,   setReplyingTo]   = useState(null);
  const [sending,      setSending]      = useState(false);
  const bodyRef  = useRef(null);
  const inputRef = useRef(null);

  const visibleReplies = replies.slice(0, visibleCount);
  const hasMore = replies.length > visibleCount;

  function handleReplyTo(replyId, replyName) {
    setReplyingTo({ id: replyId, name: replyName });
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function cancelReplyTo() {
    setReplyingTo(null);
    setReplyText('');
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !currentUserId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('comment_id', comment.id);
      fd.append('user_id',    currentUserId);
      fd.append('content',    replyText.trim());
      if (replyingTo) {
        fd.append('reply_to_id',   replyingTo.id);
        fd.append('reply_to_name', replyingTo.name);
      }
      const res = await API.post('/comments.php?action=reply', fd);
      if (res.data.success) {
        const updated = [...replies, res.data.reply];
        setReplies(updated);
        setVisibleCount(c => Math.max(c, updated.length));
        setReplyText('');
        setReplyingTo(null);
        onReplyAdded(comment.id, updated);
        setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 80);
      }
    } finally { setSending(false); }
  }

  return ReactDOM.createPortal(
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', animation: 'fadeIn 0.2s ease forwards' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col" style={{ borderRadius: 16, maxWidth: 480, maxHeight: '82vh', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: 'modalIn 0.25s ease forwards' }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '0.95rem', color: '#111' }}>
            Replies
            <span className="font-bold ml-1.5" style={{ fontSize: '0.64rem', fontFamily: "'DM Sans',sans-serif", background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.4)', padding: '2px 7px', borderRadius: 20 }}>{replies.length}</span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: '#111', width: 28, height: 28, borderRadius: '50%', fontSize: '0.8rem' }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} className="overflow-y-auto flex-1 flex flex-col gap-2.5" style={{ padding: '14px 18px' }}>
          {/* Original comment */}
          <div className="rounded-xl mb-1" style={{ background: '#f8f8f6', border: '1px solid rgba(0,0,0,0.07)', padding: '10px 12px' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Avatar name={[comment.first_name, comment.last_name].filter(Boolean).join(' ') || comment.username} size={24} />
              <span className="font-bold" style={{ fontSize: '0.7rem', color: '#111' }}>
                {[comment.first_name, comment.last_name].filter(Boolean).join(' ') || comment.username || 'Unknown'}
              </span>
              <span style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.28)' }}>{timeAgo(comment.created_at)}</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.65)', lineHeight: 1.55, paddingLeft: 31 }}>{comment.content}</div>
          </div>

          {replies.length === 0 && (
            <div className="text-center italic" style={{ padding: '24px 0', fontSize: '0.74rem', color: 'rgba(0,0,0,0.28)' }}>No replies yet. Be the first!</div>
          )}

          {visibleReplies.map(r => (
            <ReplyItem key={r.id} r={r} currentUserId={currentUserId}
              onReplyTo={handleReplyTo}
              onDelete={id => { const updated = replies.filter(x => x.id !== id); setReplies(updated); onReplyAdded(comment.id, updated); }}
              onEdit={(id, text) => { const updated = replies.map(x => x.id === id ? { ...x, content: text } : x); setReplies(updated); onReplyAdded(comment.id, updated); }}
            />
          ))}

          {hasMore && (
            <button onClick={() => setVisibleCount(c => c + 10)}
              className="w-full font-bold cursor-pointer transition-colors duration-150"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '7px 0', fontSize: '0.72rem', color: 'rgba(0,0,0,0.45)', fontFamily: "'DM Sans',sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
            >
              View more replies ({replies.length - visibleCount} remaining)
            </button>
          )}
        </div>

        {/* Footer */}
        {currentUserId ? (
          <div className="flex-shrink-0" style={{ padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', background: '#fafafa' }}>
            {replyingTo && (
              <div className="flex items-center justify-between mb-1.5" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 7, padding: '4px 10px' }}>
                <span className="font-bold" style={{ fontSize: '0.65rem', color: '#6366f1' }}>↩ Replying to {replyingTo.name}</span>
                <button onClick={cancelReplyTo} className="bg-transparent border-none cursor-pointer" style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.35)', lineHeight: 1, padding: '0 2px' }}>✕</button>
              </div>
            )}
            <form onSubmit={submitReply} className="flex gap-1.5 items-center">
              <input ref={inputRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a reply…'}
                disabled={sending}
                className="flex-1 outline-none bg-white"
                style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, padding: '7px 13px', fontSize: '0.78rem', fontFamily: "'DM Sans',sans-serif", color: '#111' }}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.28)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
              />
              <button type="submit" disabled={sending || !replyText.trim()} className="flex-shrink-0 border-none font-bold transition-all duration-150"
                style={{ background: replyText.trim() ? '#111' : 'rgba(0,0,0,0.07)', color: replyText.trim() ? '#fff' : 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '7px 15px', fontSize: '0.72rem', cursor: replyText.trim() ? 'pointer' : 'default', fontFamily: "'DM Sans',sans-serif" }}
              >Send</button>
            </form>
          </div>
        ) : (
          <div className="flex-shrink-0 italic" style={{ padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.07)', fontSize: '0.72rem', color: 'rgba(0,0,0,0.32)', background: '#fafafa' }}>Log in to reply.</div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── CommentItem ───────────────────────────────────────────────────────────────
function CommentItem({ c, currentUserId, onDelete, onEdit }) {
  const [editing,    setEditing]    = useState(false);
  const [editText,   setEditText]   = useState(c.content);
  const [saving,     setSaving]     = useState(false);
  const [showReply,  setShowReply]  = useState(false);
  const [replyText,  setReplyText]  = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending,    setSending]    = useState(false);
  const [replies,    setReplies]    = useState(c.replies || []);
  const [replyModal, setReplyModal] = useState(false);
  const [confirm,    setConfirm]    = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const replyRef = useRef(null);
  const isOwner = currentUserId && String(currentUserId) === String(c.user_id);

  const PREVIEW_LIMIT = 3;
  const previewReplies = replies.slice(0, PREVIEW_LIMIT);
  const hasMoreReplies = replies.length > PREVIEW_LIMIT;

  async function saveEdit() {
    if (!editText.trim() || editText.trim() === c.content) { setEditing(false); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('comment_id', c.id);
      fd.append('user_id',    currentUserId);
      fd.append('content',    editText.trim());
      const res = await API.post('/comments.php?action=edit', fd);
      if (res.data.success) { onEdit(c.id, editText.trim()); setEditing(false); }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append('comment_id', c.id);
      fd.append('user_id',    currentUserId);
      const res = await API.post('/comments.php?action=delete', fd);
      if (res.data.success) onDelete(c.id);
    } finally { setDeleting(false); setConfirm(false); }
  }

  async function submitReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !currentUserId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('comment_id', c.id);
      fd.append('user_id',    currentUserId);
      fd.append('content',    replyText.trim());
      if (replyingTo) {
        fd.append('reply_to_id',   replyingTo.id);
        fd.append('reply_to_name', replyingTo.name);
      }
      const res = await API.post('/comments.php?action=reply', fd);
      if (res.data.success) {
        setReplies(prev => [...prev, res.data.reply]);
        setReplyText('');
        setReplyingTo(null);
        setShowReply(false);
      }
    } finally { setSending(false); }
  }

  function toggleReply() {
    setReplyingTo(null);
    setShowReply(v => !v);
    setTimeout(() => replyRef.current?.focus(), 80);
  }

  return (
    <>
      <div className="flex gap-2 items-start">
        <Avatar name={displayName(c)} size={28} />
        <div className="flex-1">
          <div className={`bg-gray-100 rounded-tr-xl rounded-br-xl rounded-bl-xl px-2.5 py-1.5 inline-block max-w-full ${editing ? 'w-full' : ''}`}>
            <div className="font-bold mb-0.5" style={{ fontSize: '0.7rem', color: '#111' }}>{displayName(c)}</div>
            {editing ? (
              <div className="flex flex-col gap-1.5">
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                  className="w-full border rounded-md outline-none resize-none bg-white"
                  style={{ borderColor: 'rgba(0,0,0,0.15)', padding: '5px 8px', fontSize: '0.8rem', fontFamily: "'DM Sans',sans-serif" }}
                />
                <div className="flex gap-1.5">
                  <button onClick={saveEdit} disabled={saving} className="bg-gray-900 text-white border-none rounded-md font-bold cursor-pointer" style={{ padding: '3px 10px', fontSize: '0.68rem', fontFamily: "'DM Sans',sans-serif" }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditText(c.content); }} className="border-none rounded-md font-bold cursor-pointer" style={{ background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.5)', padding: '3px 10px', fontSize: '0.68rem', fontFamily: "'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.68)', lineHeight: 1.5, wordBreak: 'break-word' }}>{c.content}</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-0.5 pl-1">
            <div style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.28)' }}>{timeAgo(c.created_at)}</div>
            {currentUserId && !editing && (
              <button onClick={toggleReply} className="bg-transparent border-none cursor-pointer font-bold transition-colors duration-150"
                style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.38)', fontFamily: "'DM Sans',sans-serif", padding: '1px 3px' }}
                onMouseEnter={e => e.currentTarget.style.color='#111'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.38)'}
              >Reply</button>
            )}
            {isOwner && !editing && (
              <div className="flex gap-1">
                <button onClick={() => setEditing(true)} title="Edit"
                  className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                  style={{ padding: '1px 3px', color: 'rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color='#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.3)'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button onClick={() => setConfirm(true)} title="Delete"
                  className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                  style={{ padding: '1px 3px', color: 'rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.3)'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {confirm && ReactDOM.createPortal(
            <div onClick={() => setConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-6"
              style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease forwards' }}>
              <div onClick={e => e.stopPropagation()} className="bg-white flex flex-col"
                style={{ borderRadius:16, maxWidth:380, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.2)', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards', padding:24 }}>
                <div className="mb-1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Delete Comment</div>
                <p style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.5)', lineHeight:1.65, margin:'8px 0 20px' }}>
                  Are you sure you want to delete this comment? This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirm(false)} className="border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'rgba(0,0,0,0.07)', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", color:'rgba(0,0,0,0.5)' }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="text-white border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'#ef4444', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Preview replies */}
          {previewReplies.map(r => (
            <ReplyItem key={r.id} r={r} currentUserId={currentUserId}
              onReplyTo={(id, name) => { setReplyingTo({ id, name }); setShowReply(true); setTimeout(() => replyRef.current?.focus(), 80); }}
              onDelete={id => setReplies(prev => prev.filter(x => x.id !== id))}
              onEdit={(id, text) => setReplies(prev => prev.map(x => x.id === id ? { ...x, content: text } : x))}
            />
          ))}

          {hasMoreReplies && (
            <button onClick={() => setReplyModal(true)}
              className="bg-transparent border-none cursor-pointer font-bold underline transition-colors duration-150 mt-1.5"
              style={{ marginLeft: 36, fontSize: '0.64rem', color: 'rgba(0,0,0,0.4)', fontFamily: "'DM Sans',sans-serif", textUnderlineOffset: '3px' }}
              onMouseEnter={e => e.currentTarget.style.color='#111'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.4)'}
            >View all {replies.length} replies</button>
          )}

          {/* Inline reply input */}
          {showReply && currentUserId && (
            <div className="mt-2 pl-9">
              {replyingTo && (
                <div className="flex items-center justify-between mb-1.5" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 7, padding: '3px 9px' }}>
                  <span className="font-bold" style={{ fontSize: '0.62rem', color: '#6366f1' }}>↩ Replying to {replyingTo.name}</span>
                  <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-transparent border-none cursor-pointer" style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.35)', lineHeight: 1, padding: '0 2px' }}>✕</button>
                </div>
              )}
              <form onSubmit={submitReply} className="flex gap-1.5 items-center">
                <input ref={replyRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a reply…'} disabled={sending}
                  className="flex-1 outline-none"
                  style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, padding: '5px 12px', fontSize: '0.76rem', fontFamily: "'DM Sans',sans-serif", background: '#f9f9f8', color: '#111' }}
                  onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.28)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                />
                <button type="submit" disabled={sending || !replyText.trim()} className="border-none font-bold transition-all duration-150"
                  style={{ background: replyText.trim() ? '#111' : 'rgba(0,0,0,0.07)', color: replyText.trim() ? '#fff' : 'rgba(0,0,0,0.25)', borderRadius: 16, padding: '5px 13px', fontSize: '0.7rem', cursor: replyText.trim() ? 'pointer' : 'default', fontFamily: "'DM Sans',sans-serif" }}
                >Send</button>
                <button type="button" onClick={() => { setShowReply(false); setReplyText(''); setReplyingTo(null); }} className="bg-transparent border-none cursor-pointer" style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.35)', fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {replyModal && (
        <ReplyModal
          comment={{ ...c, replies }}
          currentUserId={currentUserId}
          onClose={() => setReplyModal(false)}
          onReplyAdded={(commentId, updatedReplies) => setReplies(updatedReplies)}
        />
      )}
    </>
  );
}

// ── CommentSection ────────────────────────────────────────────────────────────
function CommentSection({ mediaId, currentUserId, onViewAll }) {
  const [open,     setOpen]     = useState(false);
  const [comments, setComments] = useState([]);
  const [loaded,   setLoaded]   = useState(false);
  const [count,    setCount]    = useState(0);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    API.get(`/comments.php?media_id=${mediaId}`)
      .then(r => { setComments(r.data); setCount(r.data.length); setLoaded(true); });
  }, [mediaId]);

  

  const previewComments = [...comments].slice(-3);

  function toggle() {
    setOpen(o => !o);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  async function submit(e) {
    e.preventDefault();
    if (!text.trim() || !currentUserId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('media_id', mediaId);
      fd.append('user_id',  currentUserId);
      fd.append('content',  text.trim());
      const r = await API.post('/comments.php', fd);
      if (r.data.success) {
        setComments(c => [...c, r.data.comment]);
        setCount(n => n + 1);
        setText('');
      }
    } finally { setSending(false); }
  }

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="px-4 py-2">
        <button onClick={toggle} className="bg-transparent border-none cursor-pointer flex items-center gap-1.5 py-1" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: '0.76rem', color: 'rgba(0,0,0,0.42)', fontWeight: 600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Comment'}
          <span style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.25)', marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 px-4 pb-3.5">
          {!loaded && <div style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.28)' }}>Loading…</div>}
          {loaded && comments.length === 0 && (
            <div className="italic" style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.28)' }}>No comments yet. Be the first!</div>
          )}

          {previewComments.map(c => (
            <CommentItem key={c.id} c={c} currentUserId={currentUserId}
              onDelete={id => { setComments(prev => prev.filter(x => x.id !== id)); setCount(n => n - 1); }}
              onEdit={(id, text) => setComments(prev => prev.map(x => x.id === id ? { ...x, content: text } : x))}
            />
          ))}

          {count > 3 && (
            <button onClick={() => onViewAll(comments)}
              className="bg-transparent border-none cursor-pointer py-0.5 font-bold underline text-left"
              style={{ fontSize: '0.74rem', color: 'rgba(0,0,0,0.45)', fontFamily: "'DM Sans',sans-serif", textUnderlineOffset: '3px' }}
            >View all {count} comments</button>
          )}

          {currentUserId ? (
            <form onSubmit={submit} className="flex gap-2 items-center mt-0.5">
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                placeholder="Write a comment…" disabled={sending}
                className="flex-1 outline-none"
                style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 20, padding: '7px 14px', fontSize: '0.8rem', fontFamily: "'DM Sans',sans-serif", background: '#f9f9f8', color: '#111' }}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.28)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
              />
              <button type="submit" disabled={sending || !text.trim()} className="border-none font-bold transition-all duration-150"
                style={{ background: text.trim() ? '#111' : 'rgba(0,0,0,0.07)', color: text.trim() ? '#fff' : 'rgba(0,0,0,0.25)', borderRadius: 20, padding: '7px 16px', fontSize: '0.73rem', cursor: text.trim() ? 'pointer' : 'default', fontFamily: "'DM Sans',sans-serif" }}
              >Send</button>
            </form>
          ) : (
            <div className="italic" style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.32)' }}>Log in to comment.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── CaptionBlock ──────────────────────────────────────────────────────────────
function CaptionBlock({ isAlbum, post }) {
  const [visibleLen, setVisibleLen] = useState(300);
  const CHUNK = 300;

  const showMore = (total) => setVisibleLen(v => Math.min(v + CHUNK, total));
  const collapse = () => setVisibleLen(CHUNK);

  if (isAlbum) {
    const story = post.story || '';
    const hasMore = visibleLen < story.length;
    const isExpanded = visibleLen >= story.length && story.length > CHUNK;
    return (
      <div className="px-4 pb-2.5" style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.68)', lineHeight: 1.65, wordBreak: 'break-word' }}>
        <strong style={{ fontFamily: "'DM Serif Display',serif", color: '#111', fontSize: '0.95rem' }}>{post.name}</strong>
        {story && (
          <><br/>
          <span style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.5)', whiteSpace: 'pre-wrap' }}>
            {story.slice(0, visibleLen).trimEnd()}
            {hasMore && (
              <>{' … '}<span onClick={() => showMore(story.length)} className="font-bold cursor-pointer" style={{ color: '#111', fontSize: '0.82rem' }}>See more</span></>
            )}
            {isExpanded && (
              <> <span onClick={collapse} className="font-bold cursor-pointer" style={{ color: '#111', fontSize: '0.82rem' }}>See less</span></>
            )}
          </span></>
        )}
      </div>
    );
  }

  const caption = post.caption || '';
  if (!caption) {
    return (
      <div className="px-4 pb-2.5" style={{ fontSize: '0.9rem', lineHeight: 1.65 }}>
        <span className="italic" style={{ color: 'rgba(0,0,0,0.26)' }}>No caption</span>
      </div>
    );
  }

  const hasMore = visibleLen < caption.length;
  const isExpanded = visibleLen >= caption.length && caption.length > CHUNK;
  return (
    <div className="px-4 pb-2.5" style={{ fontSize: '0.9rem', color: 'rgba(0,0,0,0.68)', lineHeight: 1.75, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
      {caption.slice(0, visibleLen).trimEnd()}
      {hasMore && (
        <>{' … '}<span onClick={() => showMore(caption.length)} className="font-bold cursor-pointer" style={{ color: '#111', fontSize: '0.82rem' }}>See more</span></>
      )}
      {isExpanded && (
        <> <span onClick={collapse} className="font-bold cursor-pointer" style={{ color: '#111', fontSize: '0.82rem' }}>See less</span></>
      )}
    </div>
  );
}
function AlbumGrid({ media, baseUrl, onImageClick }) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const startXRef = React.useRef(null);
  const movedRef = React.useRef(false);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  function handleTouchStart(e) {
    startXRef.current = e.touches[0].clientX;
    movedRef.current = false;
  }

  function handleTouchMove(e) {
    if (startXRef.current === null) return;
    const diff = Math.abs(e.touches[0].clientX - startXRef.current);
    if (diff > 10) movedRef.current = true;
  }

  function handleTouchEnd(e) {
    if (startXRef.current === null) return;
    const diff = startXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) setActiveIdx(i => Math.min(i + 1, media.length - 1));
      else setActiveIdx(i => Math.max(i - 1, 0));
    }
    startXRef.current = null;
  }

  function handleImageClick(item, idx) {
    if (movedRef.current) return; // swipe, not tap
    onImageClick({ src: mediaUrl(item.file_path), caption: item.caption, all: media, currentIdx: idx });
  }

  // Desktop: original grid layout
  if (!isMobile) {
    return (
      <div>
        <div style={{ display: 'grid', gap: 2, gridTemplateColumns: media.length === 1 ? '1fr' : media.length === 2 ? '1fr 1fr' : 'repeat(3,1fr)' }}>
          {media.slice(0, 3).map((m, idx) => {
            const showOverlay = idx === 2 && media.length > 3;
            const extra = media.length - 3;
            return (
              <div key={m.id} className="relative overflow-hidden" style={{ paddingBottom: media.length === 1 ? '52%' : '100%', background: '#f0f0ee' }}>
                {m.file_type === 'image' && (
                  <img src={mediaUrl(m.file_path)} alt={m.caption}
                    onClick={() => !showOverlay && onImageClick({ src: mediaUrl(m.file_path), caption: m.caption, all: media, currentIdx: idx })}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
                    style={{ cursor: showOverlay ? 'default' : 'zoom-in' }}
                    onMouseEnter={e => { if (!showOverlay) e.currentTarget.style.transform='scale(1.04)'; }}
                    onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                  />
                )}
                {m.file_type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#111' }}>
                    <div className="flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)' }}>
                      <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '11px solid rgba(255,255,255,0.65)', marginLeft: 3 }}/>
                    </div>
                  </div>
                )}
                {showOverlay && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.52)', cursor:'pointer' }}
                    onClick={() => onImageClick({ src: mediaUrl(m.file_path), caption: m.caption, all: media, currentIdx: 2 })}>
                    <span className="text-white font-bold" style={{ fontSize: '1.4rem' }}>+{extra}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="py-1.5 px-4" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.3)' }}>
          {media.length} file{media.length != 1 ? 's' : ''} in this album
        </div>
      </div>
    );
  }

  // Mobile: swipeable carousel
  return (
    <div>
      <div
        style={{ background: '#f0f0ee', userSelect: 'none', height: 260, position: 'relative', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div style={{
          display: 'flex',
          width: `${media.length * 100}%`,
          height: '100%',
          transform: `translateX(${-(activeIdx * (100 / media.length))}%)`,
          transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'transform',
        }}>
          {media.map((item, idx) => (
            <div key={item.id} style={{ width: `${100 / media.length}%`, height: '100%', flexShrink: 0, position: 'relative' }}>
              {item.file_type === 'image' && (
                <img
                  src={mediaUrl(item.file_path)}
                  alt={item.caption}
                  onClick={() => handleImageClick(item, idx)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'zoom-in', pointerEvents: 'auto' }}
                  draggable={false}
                />
              )}
              {item.file_type === 'video' && (
                <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '13px solid rgba(255,255,255,0.65)', marginLeft: 3 }}/>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Prev/Next arrows */}
        {activeIdx > 0 && (
          <button onClick={e => { e.stopPropagation(); setActiveIdx(i => i - 1); }}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
        )}
        {activeIdx < media.length - 1 && (
          <button onClick={e => { e.stopPropagation(); setActiveIdx(i => i + 1); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}

        {/* Dot indicators */}
        {media.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
            {media.map((_, i) => (
              <div key={i} onClick={() => setActiveIdx(i)}
                style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
            ))}
          </div>
        )}

        {/* Counter */}
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '2px 9px', fontSize: '0.62rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700, zIndex: 2 }}>
          {activeIdx + 1} / {media.length}
        </div>
      </div>

      <div className="py-1.5 px-4" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.3)' }}>
        {media.length} file{media.length != 1 ? 's' : ''} in this album
      </div>
    </div>
  );
}

// ── FeedPost ──────────────────────────────────────────────────────────────────
function FeedPost({ post, baseUrl, currentUserId, onImageClick, onViewAll, animDelay }) {
  const isAlbum = post._type === 'album';
  const name    = displayName(post);

  const typeBadgeStyle = {
    background: isAlbum ? 'rgba(99,102,241,0.09)' : post.file_type === 'image' ? 'rgba(22,163,74,0.08)' : post.file_type === 'video' ? 'rgba(99,102,241,0.08)' : 'rgba(217,119,6,0.08)',
    color:      isAlbum ? '#6366f1'               : post.file_type === 'image' ? '#16a34a'               : post.file_type === 'video' ? '#6366f1'               : '#d97706',
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', animation: 'fadeUp 0.5s ease forwards', opacity: 0, animationDelay: `${animDelay}s` }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5">
        <Avatar name={name} size={40} />
        <div className="flex-1">
          <div className="font-bold" style={{ fontSize: '0.88rem', color: '#111', fontFamily: "'DM Serif Display',serif" }}>{name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ fontSize: '0.68rem', color: 'rgba(0,0,0,0.35)' }}>{timeAgo(post.uploaded_at || post.created_at)}</span>
            <span style={{ color: 'rgba(0,0,0,0.15)' }}>·</span>
            <span className="font-black uppercase" style={{ fontSize: '0.54rem', letterSpacing: '0.09em', padding: '1px 7px', borderRadius: 20, ...typeBadgeStyle }}>
              {isAlbum ? 'album' : post.file_type}
            </span>
          </div>
        </div>
      </div>

      {(post.caption || post.story || post.name) && <CaptionBlock isAlbum={isAlbum} post={post} />}

      {/* Single image */}
      {!isAlbum && post.file_type === 'image' && (
        <div onClick={() => onImageClick({ src: mediaUrl(post.file_path), caption: post.caption })}
          className="overflow-hidden cursor-zoom-in" style={{ maxHeight: 460, background: '#f0f0ee' }}>
          <img src={mediaUrl(post.file_path)} alt={post.caption}
            className="w-full block object-cover transition-transform duration-300"
            onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
          />
        </div>
      )}

      {/* Video */}
      {!isAlbum && post.file_type === 'video' && (
        <div className="bg-black">
          <video src={mediaUrl(post.file_path)} controls className="w-full block" style={{ maxHeight: 420 }}/>
        </div>
      )}

      {/* Document */}
      {!isAlbum && post.file_type === 'document' && (
        <div className="px-4 pb-3">
          <a href={mediaUrl(post.file_path)} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 no-underline transition-colors duration-150"
            style={{ padding: '11px 14px', background: '#f5f5f3', borderRadius: 10, border: '1px solid rgba(0,0,0,0.07)' }}
            onMouseEnter={e => e.currentTarget.style.background='#eceae8'}
            onMouseLeave={e => e.currentTarget.style.background='#f5f5f3'}
          >
            <div className="flex items-center justify-center flex-shrink-0 text-white font-black" style={{ width: 34, height: 42, background: '#111', borderRadius: 4, fontSize: '0.5rem' }}>PDF</div>
            <div>
              <div className="font-semibold" style={{ fontSize: '0.78rem', color: '#111' }}>{post.file_name}</div>
              <div className="mt-0.5" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.36)' }}>Click to open document</div>
            </div>
          </a>
        </div>
      )}

      {/* Album grid */}
      {isAlbum && post.media?.length > 0 && (
        <AlbumGrid media={post.media} baseUrl={baseUrl} onImageClick={onImageClick} />
      )}
      {isAlbum && (!post.media || post.media.length === 0) && (
        <div className="text-center" style={{ padding: 16, color: 'rgba(0,0,0,0.22)', fontSize: '0.78rem' }}>Empty album</div>
      )}

      {/* Comments */}
      {!isAlbum && <CommentSection mediaId={post.id} currentUserId={currentUserId} onViewAll={onViewAll} />}
      {isAlbum && post.media?.length > 0 && <CommentSection mediaId={post.media[0].id} currentUserId={currentUserId} onViewAll={onViewAll} />}
    </div>
  );
}

// ── ViewerMemberCard ──────────────────────────────────────────────────────────
function ViewerMemberCard({ m, baseUrl }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [imgZoom,    setImgZoom]    = useState(false);
  const photoSrc = m.photo_path ? mediaUrl(m.photo_path) : null;

  return (
    <>
      <div onClick={() => setDetailOpen(true)}
        className="bg-white overflow-hidden cursor-pointer transition-all duration-200"
        style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', animation: 'fadeUp 0.4s ease forwards', opacity: 0 }}
        onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow='0 16px 40px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 2px 10px rgba(0,0,0,0.04)'; }}
      >
        <div className="relative overflow-hidden" style={{ width: '100%', height: 160, background: '#f0f0ee' }}>
          {photoSrc ? (
            <img src={photoSrc} alt={m.name} className="w-full h-full object-cover block transition-transform duration-300"
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="uppercase tracking-wider" style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.18)' }}>NO PHOTO</span>
            </div>
          )}
        </div>
        <div className="p-4 text-center">
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1rem', fontWeight: 400, color: '#111', lineHeight: 1.25, wordBreak: 'break-word' }}>{m.name}</div>
          {m.position && (
            <div className="font-bold uppercase tracking-wider mt-1" style={{ fontSize: '0.62rem', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.12em' }}>{m.position}</div>
          )}
          <div className="mt-2 font-semibold tracking-wider" style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.3)' }}>View Profile →</div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailOpen && ReactDOM.createPortal(
        <div onClick={() => setDetailOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease forwards' }}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col overflow-hidden" style={{ borderRadius: 16, maxWidth: 580, maxHeight: '90vh', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', animation: 'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>

            <div className="flex items-center justify-between flex-shrink-0 px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1rem', color: '#111' }}>Member Profile</div>
              <button onClick={() => setDetailOpen(false)} className="flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 7, width: 30, height: 30, fontSize: '0.85rem' }}>✕</button>
            </div>

            <div className="overflow-y-auto flex-1 flex flex-col gap-4 p-6">
              <div className="flex justify-center">
                {photoSrc ? (
                  <div onClick={() => setImgZoom(true)}
                    className="relative overflow-hidden flex-shrink-0 cursor-zoom-in"
                    style={{ width: 160, height: 160, borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.12)' }}
                    onMouseEnter={e => { e.currentTarget.querySelector('.zoom-overlay').style.background='rgba(0,0,0,0.35)'; e.currentTarget.querySelector('.zoom-label').style.opacity='1'; e.currentTarget.querySelector('img').style.transform='scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.zoom-overlay').style.background='rgba(0,0,0,0)'; e.currentTarget.querySelector('.zoom-label').style.opacity='0'; e.currentTarget.querySelector('img').style.transform='scale(1)'; }}
                  >
                    <img src={photoSrc} alt={m.name} className="w-full h-full object-cover block transition-transform duration-300" />
                    <div className="zoom-overlay absolute inset-0 pointer-events-none transition-all duration-200" style={{ background: 'rgba(0,0,0,0)' }} />
                    <span className="zoom-label absolute pointer-events-none transition-opacity duration-200" style={{ bottom: 6, right: 8, fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em', textShadow: '0 1px 4px rgba(0,0,0,0.6)', opacity: 0 }}>CLICK TO ZOOM</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2" style={{ width: 160, height: 160, borderRadius: 10, background: '#f0f0ee', border: '1.5px dashed rgba(0,0,0,0.12)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="uppercase tracking-wider" style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.2)' }}>NO PHOTO</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.2rem', color: '#111', lineHeight: 1.2 }}>{m.name}</div>
                {m.position && <div className="font-bold uppercase tracking-wider mt-1" style={{ fontSize: '0.64rem', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.12em' }}>{m.position}</div>}
              </div>

              <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                {m.gender && (
                  <div className="flex gap-2.5">
                    <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.3)', width: 80, letterSpacing: '0.1em' }}>Gender</span>
                    <span style={{ fontSize: '0.82rem', color: '#111' }}>{m.gender}</span>
                  </div>
                )}
                {m.birthday && (
                  <div className="flex gap-2.5">
                    <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.3)', width: 80, letterSpacing: '0.1em' }}>Birthday</span>
                    <span style={{ fontSize: '0.82rem', color: '#111' }}>{new Date(m.birthday).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
                  </div>
                )}
                {m.bio && (
                  <div className="flex gap-2.5 items-start">
                    <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.3)', width: 80, letterSpacing: '0.1em' }}>About</span>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.62)', lineHeight: 1.7, wordBreak: 'break-word' }}>{m.bio}</span>
                  </div>
                )}
                <div className="flex gap-2.5">
                  <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize: '0.66rem', color: 'rgba(0,0,0,0.3)', width: 80, letterSpacing: '0.1em' }}>Added</span>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.4)' }}>{new Date(m.created_at).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end flex-shrink-0 px-6 py-3.5" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', background: '#fafafa' }} />
          </div>
        </div>,
        document.body
      )}

      {imgZoom && ReactDOM.createPortal(
        <div onClick={() => setImgZoom(false)} className="fixed inset-0 flex items-center justify-center cursor-zoom-out" style={{ background: 'rgba(0,0,0,0.95)', zIndex: 1100, backdropFilter: 'blur(16px)', animation: 'fadeIn 0.2s ease forwards' }}>
          <img src={photoSrc} alt={m.name} className="w-full h-full object-contain" style={{ animation: 'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }} onClick={e => e.stopPropagation()}/>
          <button onClick={() => setImgZoom(false)} className="absolute top-5 right-6 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
        </div>,
        document.body
      )}
    </>
  );
}

// ── StarRating ────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const display = readonly ? value : (hovered || value);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className="bg-transparent border-none p-0 transition-transform duration-150"
          style={{ cursor: readonly ? 'default' : 'pointer', transform: !readonly && hovered >= star ? 'scale(1.2)' : 'scale(1)' }}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={display >= star ? '#f59e0b' : 'none'} stroke={display >= star ? '#f59e0b' : 'rgba(0,0,0,0.18)'} strokeWidth="1.8">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

// ── RatingCard ────────────────────────────────────────────────────────────────
function RatingCard({ r, currentUserId, onUpdated, onDeleted, slug }) {
  const [editing,      setEditing]      = useState(false);
  const [editStars,    setEditStars]    = useState(r.stars);
  const [editFeedback, setEditFeedback] = useState(r.feedback || '');
  const [saving,       setSaving]       = useState(false);
  const [confirm,      setConfirm]      = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const isOwner = currentUserId && String(currentUserId) === String(r.user_id);
  const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.username || 'Unknown';

  async function saveEdit() {
    if (!editStars) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('slug', slug); fd.append('user_id', currentUserId);
      fd.append('stars', editStars); fd.append('feedback', editFeedback.trim());
      const res = await API.post('/ratings.php', fd);
      if (res.data.success) { onUpdated(res.data.rating); setEditing(false); }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append('slug', slug); fd.append('user_id', currentUserId);
      const res = await API.post('/ratings.php?action=delete', fd);
      if (res.data.success) onDeleted(r.id);
    } finally { setDeleting(false); setConfirm(false); }
  }

  return (
    <div className="bg-white rounded-xl p-4" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-1">
          <Avatar name={name} size={34} />
          <div>
            <div className="font-bold" style={{ fontSize: '0.82rem', color: '#111', fontFamily: "'DM Serif Display',serif" }}>{name}</div>
            <div className="mt-0.5" style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.3)' }}>{timeAgo(r.updated_at || r.created_at)}</div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {editing ? <StarRating value={editStars} onChange={setEditStars} size={20} /> : <StarRating value={r.stars} size={20} readonly />}
        </div>
      </div>

      {editing ? (
        <div className="mt-2.5">
          <textarea value={editFeedback} onChange={e => setEditFeedback(e.target.value)} rows={3}
            placeholder="Share your experience…"
            className="w-full outline-none bg-white resize-y rounded-lg"
            style={{ border: '1.5px solid rgba(0,0,0,0.12)', padding: '8px 12px', fontSize: '0.82rem', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6, color: '#111' }}
            onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.4)'}
            onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={saveEdit} disabled={saving || !editStars} className="bg-gray-900 text-white border-none rounded-lg font-black uppercase tracking-wider cursor-pointer" style={{ padding: '6px 18px', fontSize: '0.7rem', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.08em' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setEditStars(r.stars); setEditFeedback(r.feedback || ''); }} className="border-none rounded-lg font-bold cursor-pointer" style={{ background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)', padding: '6px 14px', fontSize: '0.7rem', fontFamily: "'DM Sans',sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        r.feedback && <div className="mt-2.5" style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.62)', lineHeight: 1.7, wordBreak: 'break-word' }}>{r.feedback}</div>
      )}

      {isOwner && !editing && (
        <div className="flex gap-2 mt-2.5 pt-2" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 font-bold cursor-pointer transition-all duration-150" style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, padding: '3px 12px', fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', fontFamily: "'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,0,0,0.12)'; e.currentTarget.style.color='rgba(0,0,0,0.45)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button onClick={() => setConfirm(true)} className="flex items-center gap-1 font-bold cursor-pointer transition-all duration-150" style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, padding: '3px 12px', fontSize: '0.65rem', color: 'rgba(0,0,0,0.45)', fontFamily: "'DM Sans',sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='#ef4444'; e.currentTarget.style.color='#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(0,0,0,0.12)'; e.currentTarget.style.color='rgba(0,0,0,0.45)'; }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
            Delete
          </button>

          {confirm && ReactDOM.createPortal(
            <div onClick={() => setConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-6"
              style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease forwards' }}>
              <div onClick={e => e.stopPropagation()} className="bg-white flex flex-col"
                style={{ borderRadius:16, maxWidth:380, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.2)', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards', padding:24 }}>
                <div className="mb-1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Delete Rating</div>
                <p className="mb-5" style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.5)', lineHeight:1.65, margin:'8px 0 20px' }}>
                  Are you sure you want to delete your rating? This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirm(false)} className="border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'rgba(0,0,0,0.07)', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", color:'rgba(0,0,0,0.5)' }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="text-white border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'#ef4444', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}
    </div>
  );
}

// ── RatingsSection ────────────────────────────────────────────────────────────
function RatingsSection({ slug, currentUserId }) {
  const [ratings,     setRatings]     = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [myRating,    setMyRating]    = useState(null);
  const [loaded,      setLoaded]      = useState(false);
  const [newStars,    setNewStars]    = useState(0);
  const [newFeedback, setNewFeedback] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [msg,         setMsg]         = useState('');

  useEffect(() => { load(); }, [slug]);

  function load() {
    API.get(`/ratings.php?slug=${slug}&user_id=${currentUserId || 0}`).then(r => {
      setRatings(r.data.ratings || []);
      setSummary(r.data.summary || null);
      setMyRating(r.data.my_rating || null);
      setLoaded(true);
    });
  }

  async function submitRating(e) {
    e.preventDefault();
    if (!newStars || !currentUserId) return;
    setSubmitting(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('slug', slug); fd.append('user_id', currentUserId);
      fd.append('stars', newStars); fd.append('feedback', newFeedback.trim());
      const res = await API.post('/ratings.php', fd);
      if (res.data.success) {
        setMyRating(res.data.rating);
        setRatings(prev => { const without = prev.filter(r => String(r.user_id) !== String(currentUserId)); return [res.data.rating, ...without]; });
        setSummary(null);
        setNewStars(0); setNewFeedback('');
        load();
        setMsg('Rating submitted!');
        setTimeout(() => setMsg(''), 3000);
      }
    } finally { setSubmitting(false); }
  }

  const avg   = summary ? parseFloat(summary.average || 0).toFixed(1) : '0.0';
  const total = summary ? parseInt(summary.total || 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      {loaded && total > 0 && (
        <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <div className="flex gap-6 items-center flex-wrap">
            <div className="text-center flex-shrink-0">
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '3.5rem', fontWeight: 400, color: '#111', lineHeight: 1 }}>{avg}</div>
              <StarRating value={Math.round(parseFloat(avg))} size={18} readonly />
              <div className="mt-1" style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.35)' }}>{total} rating{total !== 1 ? 's' : ''}</div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5" style={{ minWidth: 160 }}>
              {[5,4,3,2,1].map(star => {
                const count = parseInt(summary[`s${star}`] || 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="font-bold text-right flex-shrink-0" style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.4)', width: 8 }}>{star}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" className="flex-shrink-0">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <div className="flex-1 overflow-hidden rounded-full" style={{ height: 6, background: 'rgba(0,0,0,0.07)' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#f59e0b', borderRadius: 3, transition: 'width 0.5s ease' }} />
                    </div>
                    <span className="text-right flex-shrink-0" style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.3)', width: 20 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Submit form */}
      {currentUserId ? (
        !myRating && (
          <div className="bg-white rounded-2xl p-6" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
            <div className="mb-3.5" style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1rem', color: '#111' }}>Rate this spot</div>
            <form onSubmit={submitRating} className="flex flex-col gap-3">
              <div>
                <div className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>Your rating *</div>
                <StarRating value={newStars} onChange={setNewStars} size={32} />
              </div>
              <div>
                <div className="font-bold uppercase tracking-wider mb-2" style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.35)', letterSpacing: '0.1em' }}>
                  Feedback <span className="font-normal normal-case tracking-normal">(optional)</span>
                </div>
                <textarea value={newFeedback} onChange={e => setNewFeedback(e.target.value)} rows={3}
                  placeholder="Share your experience at this spot…"
                  className="w-full outline-none bg-white resize-y rounded-lg"
                  style={{ border: '1.5px solid rgba(0,0,0,0.12)', padding: '9px 12px', fontSize: '0.85rem', fontFamily: "'DM Sans',sans-serif", lineHeight: 1.65, color: '#111' }}
                  onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.4)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={submitting || !newStars} className="border-none rounded-lg font-black uppercase tracking-wider transition-all duration-200"
                  style={{ background: newStars ? '#111' : 'rgba(0,0,0,0.1)', color: newStars ? '#fff' : 'rgba(0,0,0,0.3)', padding: '9px 24px', fontSize: '0.7rem', cursor: newStars ? 'pointer' : 'default', fontFamily: "'DM Sans',sans-serif", letterSpacing: '0.1em' }}
                >{submitting ? 'Submitting…' : 'Submit Rating'}</button>
                {msg && <span className="font-bold" style={{ fontSize: '0.74rem', color: '#16a34a' }}>{msg}</span>}
              </div>
            </form>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl text-center italic" style={{ border: '1px solid rgba(0,0,0,0.08)', padding: '20px 24px', color: 'rgba(0,0,0,0.35)', fontSize: '0.82rem' }}>
          Log in to rate this spot.
        </div>
      )}

      {!loaded && (
        <div className="bg-white text-center" style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', padding: '40px 24px', color: 'rgba(0,0,0,0.2)', fontSize: '0.82rem' }}>Loading…</div>
      )}
      {loaded && ratings.length === 0 && (
        <div className="bg-white text-center" style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: '52px 24px' }}>
          <div className="mb-2.5" style={{ fontSize: '2rem', opacity: 0.1 }}>⭐</div>
          <div style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.28)' }}>No ratings yet. Be the first to rate!</div>
        </div>
      )}

      {myRating && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div style={{ height:1, flex:1, background:'rgba(99,102,241,0.15)' }}/>
            <span className="font-black uppercase tracking-wider" style={{ fontSize:'0.58rem', letterSpacing:'0.14em', color:'#6366f1', padding:'2px 10px', borderRadius:20, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.18)' }}>Your Rating</span>
            <div style={{ height:1, flex:1, background:'rgba(99,102,241,0.15)' }}/>
          </div>
          <div style={{ border:'2px solid rgba(99,102,241,0.3)', borderRadius:14, background:'rgba(99,102,241,0.03)' }}>
            <RatingCard key={myRating.id} r={myRating} currentUserId={currentUserId} slug={slug}
              onUpdated={updated => { setMyRating(updated); setRatings(prev => prev.map(x => x.id === updated.id ? updated : x)); load(); }}
              onDeleted={id => { setMyRating(null); setRatings(prev => prev.filter(x => x.id !== id)); load(); }}
            />
          </div>
          {ratings.filter(r => String(r.user_id) !== String(currentUserId)).length > 0 && (
            <div className="flex items-center gap-2 mt-4 mb-2">
              <div style={{ height:1, flex:1, background:'rgba(0,0,0,0.07)' }}/>
              <span className="font-black uppercase tracking-wider" style={{ fontSize:'0.58rem', letterSpacing:'0.14em', color:'rgba(0,0,0,0.3)', padding:'2px 10px', borderRadius:20, background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)' }}>Other Ratings</span>
              <div style={{ height:1, flex:1, background:'rgba(0,0,0,0.07)' }}/>
            </div>
          )}
        </div>
      )}

      {ratings.filter(r => String(r.user_id) !== String(currentUserId)).map(r => (
        <RatingCard key={r.id} r={r} currentUserId={currentUserId} slug={slug}
          onUpdated={updated => { setMyRating(updated); setRatings(prev => prev.map(x => x.id === updated.id ? updated : x)); load(); }}
          onDeleted={id => { setMyRating(null); setRatings(prev => prev.filter(x => x.id !== id)); load(); }}
        />
      ))}
    </div>
  );
}
function ExperienceText({ text }) {
  const [chunkCount, setChunkCount] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const CHUNK = isMobile ? 300 : text.length;
  const totalShown = CHUNK * chunkCount;
  const displayed = text.slice(0, totalShown);
  const hasMore = totalShown < text.length;

  return (
    <div style={{ fontSize: '0.88rem', color: 'rgba(0,0,0,0.65)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {displayed}
      {hasMore && (
        <>{'… '}
          <span
            onClick={() => setChunkCount(c => c + 1)}
            className="font-bold cursor-pointer"
            style={{ color: '#111', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            See more
          </span>
        </>
      )}
      {!hasMore && chunkCount > 1 && (
        <>{' '}
          <span
            onClick={() => setChunkCount(1)}
            className="font-bold cursor-pointer"
            style={{ color: '#111', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
          >
            See less
          </span>
        </>
      )}
    </div>
  );
}
// ── Swipeable Tabs ────────────────────────────────────────────────────────────
const TAB_KEYS = ['posts', 'authors', 'ratings'];

function useSwipeTabs(activeTab, setActiveTab) {
  const ref = useRef(null);
  const startXRef = useRef(null);
  const startYRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onTouchStart(e) {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
    }
    function onTouchEnd(e) {
      if (startXRef.current === null) return;
      const dx = startXRef.current - e.changedTouches[0].clientX;
      const dy = Math.abs(e.changedTouches[0].clientY - startYRef.current);
      if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
        const idx = TAB_KEYS.indexOf(activeTab);
        if (dx > 0 && idx < TAB_KEYS.length - 1) setActiveTab(TAB_KEYS[idx + 1]);
        if (dx < 0 && idx > 0) setActiveTab(TAB_KEYS[idx - 1]);
      }
      startXRef.current = null;
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [activeTab, setActiveTab]);

  return ref;
}

// ── SpotPage ──────────────────────────────────────────────────────────────────
export default function SpotPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [media,       setMedia]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lightbox,    setLightbox]    = useState(null);
  const [commentModal,setCommentModal]= useState(null);
  const [experience,  setExperience]  = useState('');
  const [expLoading,  setExpLoading]  = useState(true);
  const [albums,      setAlbums]      = useState([]);
  const [feed,        setFeed]        = useState([]);
  const [members,     setMembers]     = useState([]);
  const [activeTab,   setActiveTab]   = useState('posts');
const swipeTabRef = useSwipeTabs(activeTab, setActiveTab);

  const currentUser   = JSON.parse(localStorage.getItem('cv_user') || 'null');
  const currentUserId = currentUser?.id ?? null;

  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [lightbox]);

  useEffect(() => {
    setLoading(true);
    Promise.all([API.get(`/media.php?slug=${slug}`), API.get(`/albums.php?slug=${slug}`)]).then(([mediaRes, albumsRes]) => {
      const mediaItems = mediaRes.data.map(m => ({ ...m, _type: 'media' }));
      const albumItems = albumsRes.data.map(a => ({ ...a, _type: 'album' }));
      const merged = [...mediaItems, ...albumItems].sort((a, b) => new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at));
      setMedia(mediaRes.data);
      setAlbums(albumsRes.data);
      setFeed(merged);
    }).finally(() => setLoading(false));

    setExpLoading(true);
    API.get(`/experience.php?slug=${slug}`).then(r => { if (r.data?.content) setExperience(r.data.content); }).finally(() => setExpLoading(false));
    API.get(`/members.php?slug=${slug}`).then(r => setMembers(r.data));
  }, [slug]);

  return (
    <div className="min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif", background: '#f5f5f3' }}>
      <style>{css}</style>

      {/* ── ANIMATED BACKGROUND ── */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0.8 }} viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        <circle cx="1100" cy="100" r="220" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="1"/>
        <circle cx="1100" cy="100" r="140" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
        <circle cx="100"  cy="800" r="260" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
        <circle cx="600"  cy="450" r="350" fill="none" stroke="rgba(0,0,0,.025)" strokeWidth="1"/>
        <line x1="0" y1="450" x2="1200" y2="450" stroke="rgba(0,0,0,.03)" strokeWidth="1"/>
        <line x1="600" y1="0" x2="600" y2="900" stroke="rgba(0,0,0,.03)" strokeWidth="1"/>
        <path d="M 1100 100 Q 600 300 100 800" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1" strokeDasharray="6 8" style={{ animation: 'dash 12s linear infinite' }}/>
        <rect x="1010" y="30" width="80" height="80" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="1" style={{ animation: 'spinSlow 20s linear infinite', transformOrigin: '1050px 70px' }}/>
        <rect x="1020" y="40" width="60" height="60" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1" style={{ animation: 'spinReverse 20s linear infinite', transformOrigin: '1050px 70px' }}/>
        <circle cx="120" cy="140" r="4" fill="rgba(0,0,0,.15)" style={{ animation: 'pulse 3s ease infinite, floatY 6s ease infinite' }}/>
        <circle cx="1080" cy="520" r="3" fill="rgba(0,0,0,.1)" style={{ animation: 'pulse 4s ease 0.8s infinite, floatY 7s ease 1s infinite' }}/>
        <circle cx="580"  cy="820" r="5" fill="rgba(0,0,0,.08)" style={{ animation: 'pulse 3.5s ease 0.4s infinite, floatY 5s ease 0.5s infinite' }}/>
      </svg>

      {/* ── HEADER ── */}
      <div className="relative z-10" style={{ padding: '48px 0 44px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.72)), url('/images/spots/${slug}.jpg') center/cover no-repeat` }}>
        <div className="sp-header-inner mx-auto px-10" style={{ maxWidth: '1200px' }}>

          <div className="flex items-center gap-3 mb-8" style={{ animation: 'fadeUp 0.6s ease 0s forwards', opacity: 0 }}>
            <span className="font-black uppercase tracking-widest" style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)' }}>Documentary</span>
          </div>

          <div className="flex items-end justify-between flex-wrap gap-5" style={{ animation: 'fadeUp 0.6s ease 0.1s forwards', opacity: 0 }}>
            <div>
              <p className="font-bold uppercase tracking-widest mb-2" style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.3)' }}>
                Baguio City · Tourist Spot
              </p>
              <h1 className="text-white m-0" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {nameMap[slug] || slug}
              </h1>
              <p className="mt-3 mb-0" style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', lineHeight: 1.8 }}>
                {descMap[slug]}
              </p>
            </div>

            <div style={{ animation: 'fadeUp 0.6s ease 0.18s forwards', opacity: 0 }} />
          </div>

          <div className="mt-7" style={{ animation: 'fadeUp 0.6s ease 0.24s forwards', opacity: 0 }}>
            <button className="sp-back-btn" onClick={() => navigate('/dashboard')}>← Back to dashboard</button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="sp-content-wrap relative z-10 mx-auto px-10" style={{ maxWidth: '1200px', paddingTop: '36px', paddingBottom: '80px' }}>
        <div className="sp-main-grid" style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,600px)', gap: '28px', alignItems: 'start', justifyContent: 'center' }}>

          {/* ── LEFT: DOCUMENTARY ── */}
          <div style={{ animation: 'fadeUp 0.6s ease 0.3s forwards', opacity: 0 }}>
            <div className="sp-left-col bg-white overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', position: 'sticky', top: 24 }}>
              <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2">
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', fontWeight: 400, color: '#111', letterSpacing: '-0.01em' }}>Documentary</div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="mt-0.5" style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)' }}>Author's personal experience at this spot</div>
              </div>

              <div className="p-6">
                {expLoading ? (
                  <div className="flex items-center justify-center rounded-xl" style={{ height: 200, background: '#f5f5f3' }}>
                    <span className="uppercase tracking-wider" style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.2)' }}>Loading…</span>
                  </div>
                ) : experience ? (
                  <ExperienceText text={experience} />
                ) : (
                  <div className="py-10 text-center">
                    <div className="mb-2.5" style={{ fontSize: '1.5rem', opacity: 0.15 }}>✎</div>
                    <div className="uppercase tracking-wider" style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.25)' }}>No documentary written yet.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: TABS ── */}
          <div ref={swipeTabRef} className="flex flex-col gap-4" style={{ animation: 'fadeUp 0.6s ease 0.38s forwards', opacity: 0 }}>

            {/* Tab switcher */}
            <div className="flex gap-0 bg-white p-1 rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              {[
                { key: 'posts',   label: 'Posts',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
                { key: 'authors', label: 'Authors', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { key: 'ratings', label: 'Ratings', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
              ].map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 border-none rounded-lg font-black uppercase tracking-wider cursor-pointer transition-all duration-200"
                  style={{ background: activeTab === t.key ? '#111' : 'transparent', color: activeTab === t.key ? '#fff' : 'rgba(0,0,0,0.4)', padding: '10px 0', fontSize: '0.72rem', letterSpacing: '0.1em', fontFamily: "'DM Sans',sans-serif" }}
                >{t.icon}<span className="sp-tab-label">{t.label}</span></button>
              ))}
            </div>
            {/* Swipe hint — mobile only */}
            <div className="sp-swipe-hint" style={{ textAlign: 'center', fontSize: '0.6rem', color: 'rgba(0,0,0,0.22)', letterSpacing: '0.1em', marginTop: -8, display: 'none' }}>
              ← swipe to change tabs →
            </div>

            {/* Posts tab */}
            {activeTab === 'posts' && <>
              {loading && (
                <div className="bg-white text-center uppercase tracking-wider" style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', padding: '60px 24px', color: 'rgba(0,0,0,0.2)', fontSize: '0.82rem', letterSpacing: '0.08em' }}>
                  Loading feed…
                </div>
              )}
              {!loading && feed.length === 0 && (
                <div className="bg-white text-center" style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: '52px 24px' }}>
                  <div className="mb-2.5" style={{ fontSize: '2rem', opacity: 0.1 }}>📷</div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.28)' }}>No posts yet.</div>
                </div>
              )}
              {!loading && feed.map((post, i) => (
                <FeedPost key={`${post._type}-${post.id}`} post={post} baseUrl={BASE} currentUserId={currentUserId}
                  onImageClick={setLightbox} onViewAll={comments => setCommentModal(comments)} animDelay={i * 0.05}
                />
              ))}
            </>}

            {/* Authors tab */}
            {activeTab === 'authors' && (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1.15rem', color: '#111' }}>Authors & Team</div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.65)" strokeWidth="1.8">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div className="mt-0.5" style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.38)' }}>
                    {members.length} member{members.length !== 1 ? 's' : ''} listed
                  </div>
                </div>
                {members.length === 0 && (
                  <div className="bg-white text-center" style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', padding: '52px 24px' }}>
                    <div className="mb-2.5" style={{ fontSize: '2rem', opacity: 0.1 }}>👤</div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(0,0,0,0.28)' }}>No members listed yet.</div>
                  </div>
                )}
                <div className="sp-members-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                  {members.map(m => <ViewerMemberCard key={m.id} m={m} baseUrl={BASE} />)}
                </div>
              </div>
            )}

            {/* Ratings tab */}
            {activeTab === 'ratings' && <RatingsSection slug={slug} currentUserId={currentUserId} />}
          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox && (() => {
        const all = lightbox.all
          ? lightbox.all.filter(m => m.file_type === 'image')
          : [{ file_path: null, src: lightbox.src, caption: lightbox.caption }];
        const ci = lightbox.currentIdx ?? 0;
        const cur = all[ci];
        const curSrc = cur?.file_path ? BASE + cur.file_path : (cur?.src || lightbox.src);
        const curCap = cur?.caption || '';
        const setIdx = (i) => setLightbox({ ...lightbox, currentIdx: (i + all.length) % all.length });

        return (
          <div className="sp-lightbox-overlay" onClick={() => setLightbox(null)}
            tabIndex={0} ref={el => el?.focus()}
            onKeyDown={e => { if (e.key === 'ArrowLeft') { e.stopPropagation(); setIdx(ci - 1); } if (e.key === 'ArrowRight') { e.stopPropagation(); setIdx(ci + 1); } }}
            onTouchMove={e => e.preventDefault()}
          >
            <img src={curSrc} alt={curCap} className="sp-lightbox-img"
              onClick={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              onTouchMove={e => { e.stopPropagation(); e.preventDefault(); }}
              onTouchEnd={e => e.stopPropagation()}
            />
            {curCap && (
              <div className="mt-4 text-center" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.84rem', maxWidth: 520, lineHeight: 1.6 }}>{curCap}</div>
            )}

            {all.length > 1 && (
              <>
                <button onClick={e => { e.stopPropagation(); setIdx(ci - 1); }}
                  className="absolute flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{ left: 20, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button onClick={e => { e.stopPropagation(); setIdx(ci + 1); }}
                  className="absolute flex items-center justify-center cursor-pointer transition-all duration-150"
                  style={{ right: 20, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)', color: '#fff' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div className="absolute" style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: '3px 12px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
                  {ci + 1} / {all.length}
                </div>
              </>
            )}

            <button onClick={() => setLightbox(null)} className="absolute top-5 right-6 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
          </div>
        );
      })()}

      {/* ── All Comments Modal ── */}
      {commentModal && (
        <div onClick={() => setCommentModal(null)} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col" style={{ borderRadius: 16, maxWidth: 480, maxHeight: '80vh', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', animation: 'modalIn 0.25s ease forwards' }}>
            <div className="flex items-center justify-between flex-shrink-0 px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '1rem', color: '#111' }}>
                All Comments
                <span className="font-bold ml-2" style={{ fontSize: '0.68rem', fontFamily: "'DM Sans',sans-serif", background: 'rgba(0,0,0,0.07)', color: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: 20 }}>{commentModal.length}</span>
              </div>
              <button onClick={() => setCommentModal(null)} className="flex items-center justify-center cursor-pointer" style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: '#111', width: 30, height: 30, borderRadius: '50%', fontSize: '0.85rem' }}>✕</button>
            </div>
            <div className="overflow-y-auto flex-1 flex flex-col gap-3 px-5 py-4" style={{ maxHeight: '50vh' }}>
              {commentModal.length === 0 && (
                <div className="text-center py-8 italic" style={{ fontSize: '0.78rem', color: 'rgba(0,0,0,0.28)' }}>No comments yet.</div>
              )}
              {commentModal.map(c => (
                <CommentItem key={c.id} c={c} currentUserId={currentUserId}
                  onDelete={id => setCommentModal(prev => prev.filter(x => x.id !== id))}
                  onEdit={(id, text) => setCommentModal(prev => prev.map(x => x.id === id ? { ...x, content: text } : x))}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}