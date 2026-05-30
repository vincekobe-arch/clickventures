import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import API from '../services/api';

const BASE = '';

function mediaUrl(filePath) {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  return BASE + filePath;
}

const spotNames = {
  'ili-likha':            'Ili-Likha Village',
  'lourdes-grotto':       'Our Lady of Lourdes Grotto',
  'botanical-garden':     'Botanical Garden',
  'igorot-stone-kingdom': 'Igorot Stone Kingdom',
  'camp-john-hay':        'Camp John Hay',
};

const descMap = {
  'ili-likha':            'A living cultural village celebrating the indigenous arts, crafts, and traditions of the Cordilleran people.',
  'lourdes-grotto':       'A sacred hilltop shrine perched above Baguio City, offering breathtaking panoramic views.',
  'botanical-garden':     'A lush sanctuary of native Cordilleran plants, flowers, and a traditional Igorot village.',
  'igorot-stone-kingdom': 'An awe-inspiring cultural heritage site featuring massive stone carvings of the Igorot people.',
  'camp-john-hay':        'A historic former American military camp now transformed into a premier leisure destination.',
};

const FILTERS = ['All', 'Albums', 'Images', 'Videos', 'Documents'];

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
  @keyframes scaleIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }

  .cv-input {
    width: 100%; padding: 11px 14px;
    border: 1.5px solid rgba(0,0,0,0.12); border-radius: 8px;
    font-size: 0.875rem; color: #111; outline: none;
    box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
    font-family: 'DM Sans', sans-serif;
    background: #fff;
    resize: vertical;
  }
  .cv-input:focus {
    border-color: rgba(0,0,0,0.5);
    box-shadow: 0 0 0 3px rgba(0,0,0,0.06);
  }
  .cv-input::placeholder { color: rgba(0,0,0,0.28); }

  .media-thumb {
    position: relative; overflow: hidden;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 10px;
    cursor: pointer;
    background: #fff;
    transition: transform 0.22s, box-shadow 0.22s, border-color 0.22s;
  }
  .media-thumb:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.12);
    border-color: rgba(0,0,0,0.18);
  }
  .media-thumb .expand-btn {
    position: absolute; top: 8px; right: 8px;
    background: rgba(255,255,255,0.88); border: 1px solid rgba(0,0,0,0.12);
    color: #111; width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; cursor: pointer;
    opacity: 0; transition: opacity 0.18s;
    backdrop-filter: blur(6px);
    z-index: 2;
  }
  .media-thumb:hover .expand-btn { opacity: 1; }

  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: 32px;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.22s ease forwards;
  }
  .modal-box {
    position: relative;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 14px;
    overflow: hidden;
    animation: modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards;
    display: flex; flex-direction: column;
    max-width: 680px; width: 100%;
    max-height: 80vh;
    box-shadow: 0 24px 80px rgba(0,0,0,0.18);
  }
  .modal-box.fullscreen {
    max-width: 100vw; max-height: 100vh;
    border-radius: 0; border: none;
    width: 100vw; height: 100vh;
  }
  .modal-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    background: #fafafa;
    flex-shrink: 0;
  }
  .modal-media {
    flex: 1; overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: #f0f0ee;
    min-height: 0;
  }
  .modal-media img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  .modal-media video { max-width: 100%; max-height: 100%; display: block; }
  .modal-footer {
    padding: 12px 16px;
    border-top: 1px solid rgba(0,0,0,0.07);
    font-size: 0.8rem; color: rgba(0,0,0,0.45);
    flex-shrink: 0;
  }

  .drop-zone {
    border: 2px dashed rgba(0,0,0,0.14);
    border-radius: 10px; padding: 20px;
    text-align: center; cursor: pointer;
    background: #fafafa;
    transition: all 0.2s;
  }
  .drop-zone:hover, .drop-zone.dragover {
    border-color: rgba(0,0,0,0.35);
    background: rgba(0,0,0,0.03);
  }

  .ad-back-btn {
    background: transparent; border: 1.5px solid rgba(255,255,255,0.35);
    color: rgba(255,255,255,0.7); padding: 7px 18px; border-radius: 6px;
    font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; font-family: 'DM Sans', sans-serif;
  }
  .ad-back-btn:hover { border-color: rgba(255,255,255,0.9); color: #fff; }
  @media (max-width: 768px) {
    .ad-main-grid { grid-template-columns: 1fr !important; }
    .ad-left-col { position: static !important; }
    .ad-header-inner { padding-left: 20px !important; padding-right: 20px !important; }
    .ad-content-wrap { padding-left: 20px !important; padding-right: 20px !important; }
    .ad-tab-label { display: none !important; }
    .ad-members-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .ad-ratings-bar { flex-direction: column !important; }
    .modal-box { max-width: 100vw !important; margin: 0 12px !important; }
    .ad-upload-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .modal-overlay { padding: 12px !important; padding-top: 72px !important; align-items: flex-start !important; }
    .ad-modal-inner { padding: 4px !important; }
    .ad-form-grid { grid-template-columns: 1fr !important; }
    .ad-portal-overlay { padding: 72px 12px 12px !important; align-items: flex-start !important; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function CaptionBlock({ isAlbum, post }) {
  const [expanded, setExpanded] = React.useState(false);
  const LIMIT = 180;
  if (isAlbum) {
    return (
      <div className="px-4 pb-3" style={{ fontSize:'0.9rem', color:'rgba(0,0,0,0.68)', lineHeight:1.65, wordBreak:'break-word' }}>
        <strong style={{ fontFamily:"'DM Serif Display',serif", color:'#111', fontSize:'0.95rem' }}>{post.name}</strong>
        {post.story && <><br/><span style={{ fontSize:'0.84rem', color:'rgba(0,0,0,0.5)' }}>{post.story}</span></>}
      </div>
    );
  }
  const caption = post.caption || '';
  if (!caption) {
    return (
      <div className="px-4 pb-3" style={{ fontSize:'0.9rem', lineHeight:1.65 }}>
        <span className="italic" style={{ color:'rgba(0,0,0,0.26)' }}>No caption</span>
      </div>
    );
  }
  const isLong = caption.length > LIMIT;
  const displayed = isLong && !expanded ? caption.slice(0, LIMIT).trimEnd() : caption;
  return (
    <div className="px-4 pb-3" style={{ fontSize:'0.9rem', color:'rgba(0,0,0,0.68)', lineHeight:1.75, wordBreak:'break-word', whiteSpace:'pre-wrap' }}>
      {displayed}
      {isLong && !expanded && (
        <>{' … '}<span onClick={() => setExpanded(true)} className="font-bold cursor-pointer" style={{ color:'#111', fontSize:'0.82rem' }}>See more</span></>
      )}
      {isLong && expanded && (
        <> <span onClick={() => setExpanded(false)} className="font-bold cursor-pointer" style={{ color:'#111', fontSize:'0.82rem' }}>See less</span></>
      )}
    </div>
  );
}

// ── AdminReplyItem ─────────────────────────────────────────────────────────────
function AdminReplyItem({ r, currentUserId, onDelete, onEdit, onReplyTo }) {
  const [editing,  setEditing]  = React.useState(false);
  const [editText, setEditText] = React.useState(r.content);
  const [saving,   setSaving]   = React.useState(false);
  const [replyConfirm,  setReplyConfirm]  = React.useState(false);
  const [replyDeleting, setReplyDeleting] = React.useState(false);
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
          <div className="font-bold text-gray-900 mb-0.5" style={{ fontSize:'0.65rem' }}>{name}</div>
          {r.reply_to_name && (
            <div className="font-bold mb-1" style={{ fontSize:'0.62rem', color:'#6366f1' }}>↩ {r.reply_to_name}</div>
          )}
          {editing ? (
            <div className="flex flex-col gap-1.5">
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                className="w-full border rounded-md outline-none resize-none bg-white"
                style={{ borderColor:'rgba(0,0,0,0.15)', padding:'4px 7px', fontSize:'0.76rem', fontFamily:"'DM Sans',sans-serif" }}
              />
              <div className="flex gap-1.5">
                <button onClick={saveEdit} disabled={saving} className="bg-gray-900 text-white border-none rounded-md font-bold cursor-pointer" style={{ padding:'2px 9px', fontSize:'0.64rem', fontFamily:"'DM Sans',sans-serif" }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => { setEditing(false); setEditText(r.content); }} className="border-none rounded-md font-bold cursor-pointer" style={{ background:'rgba(0,0,0,0.07)', color:'rgba(0,0,0,0.5)', padding:'2px 9px', fontSize:'0.64rem', fontFamily:"'DM Sans',sans-serif" }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:'0.76rem', color:'rgba(0,0,0,0.68)', lineHeight:1.45, wordBreak:'break-word' }}>{r.content}</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 pl-0.5">
          <div style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.28)' }}>{timeAgo(r.created_at)}</div>
          {currentUserId && !editing && (
            <button onClick={() => onReplyTo && onReplyTo(r.id, name)}
              className="bg-transparent border-none cursor-pointer font-bold transition-colors duration-150"
              style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.35)', fontFamily:"'DM Sans',sans-serif", padding:'1px 2px' }}
              onMouseEnter={e => e.currentTarget.style.color='#111'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.35)'}
            >Reply</button>
          )}
          {isOwner && !editing && (
            <div className="flex gap-0.5">
              <button onClick={() => setEditing(true)} title="Edit"
                className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                style={{ padding:'1px 2px', color:'rgba(0,0,0,0.28)' }}
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
                style={{ padding:'1px 2px', color:'rgba(0,0,0,0.28)' }}
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

// ── AdminReplyModal ────────────────────────────────────────────────────────────
function AdminReplyModal({ comment, currentUserId, onClose, onReplyAdded }) {
  const [replies,      setReplies]      = React.useState(comment.replies || []);
  const [visibleCount, setVisibleCount] = React.useState(10);
  const [replyText,    setReplyText]    = React.useState('');
  const [replyingTo,   setReplyingTo]   = React.useState(null);
  const [sending,      setSending]      = React.useState(false);
  const bodyRef  = React.useRef(null);
  const inputRef = React.useRef(null);

  const visibleReplies = replies.slice(0, visibleCount);
  const hasMore = replies.length > visibleCount;

  function handleReplyTo(replyId, replyName) {
    setReplyingTo({ id: replyId, name: replyName });
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function cancelReplyTo() { setReplyingTo(null); setReplyText(''); }

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
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease forwards' }}>
      <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col"
        style={{ borderRadius:16, maxWidth:480, maxHeight:'82vh', boxShadow:'0 24px 80px rgba(0,0,0,0.25)', animation:'modalIn 0.25s ease forwards' }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding:'14px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'0.95rem', color:'#111' }}>
            Replies
            <span className="font-bold ml-1.5" style={{ fontSize:'0.64rem', fontFamily:"'DM Sans',sans-serif", background:'rgba(0,0,0,0.07)', color:'rgba(0,0,0,0.4)', padding:'2px 7px', borderRadius:20 }}>{replies.length}</span>
          </div>
          <button onClick={onClose} className="flex items-center justify-center cursor-pointer"
            style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.1)', color:'#111', width:28, height:28, borderRadius:'50%', fontSize:'0.8rem' }}>✕</button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="overflow-y-auto flex-1 flex flex-col gap-2.5" style={{ padding:'14px 18px' }}>
          <div className="rounded-xl mb-1" style={{ background:'#f8f8f6', border:'1px solid rgba(0,0,0,0.07)', padding:'10px 12px' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Avatar name={[comment.first_name, comment.last_name].filter(Boolean).join(' ') || comment.username} size={24} />
              <span className="font-bold" style={{ fontSize:'0.7rem', color:'#111' }}>
                {[comment.first_name, comment.last_name].filter(Boolean).join(' ') || comment.username || 'Unknown'}
              </span>
              <span style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.28)' }}>{timeAgo(comment.created_at)}</span>
            </div>
            <div style={{ fontSize:'0.8rem', color:'rgba(0,0,0,0.65)', lineHeight:1.55, paddingLeft:31 }}>{comment.content}</div>
          </div>

          {replies.length === 0 && (
            <div className="text-center italic" style={{ padding:'24px 0', fontSize:'0.74rem', color:'rgba(0,0,0,0.28)' }}>No replies yet. Be the first!</div>
          )}

          {visibleReplies.map(r => (
            <AdminReplyItem key={r.id} r={r} currentUserId={currentUserId}
              onReplyTo={handleReplyTo}
              onDelete={id => { const updated = replies.filter(x => x.id !== id); setReplies(updated); onReplyAdded(comment.id, updated); }}
              onEdit={(id, text) => { const updated = replies.map(x => x.id === id ? { ...x, content: text } : x); setReplies(updated); onReplyAdded(comment.id, updated); }}
            />
          ))}

          {hasMore && (
            <button onClick={() => setVisibleCount(c => c + 10)}
              className="w-full font-bold cursor-pointer transition-colors duration-150"
              style={{ background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:8, padding:'7px 0', fontSize:'0.72rem', color:'rgba(0,0,0,0.45)', fontFamily:"'DM Sans',sans-serif" }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
            >
              View more replies ({replies.length - visibleCount} remaining)
            </button>
          )}
        </div>

        {/* Footer */}
        {currentUserId ? (
          <div className="flex-shrink-0" style={{ padding:'10px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', background:'#fafafa' }}>
            {replyingTo && (
              <div className="flex items-center justify-between mb-1.5" style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.18)', borderRadius:7, padding:'4px 10px' }}>
                <span className="font-bold" style={{ fontSize:'0.65rem', color:'#6366f1' }}>↩ Replying to {replyingTo.name}</span>
                <button onClick={cancelReplyTo} className="bg-transparent border-none cursor-pointer" style={{ fontSize:'0.7rem', color:'rgba(0,0,0,0.35)', lineHeight:1, padding:'0 2px' }}>✕</button>
              </div>
            )}
            <form onSubmit={submitReply} className="flex gap-1.5 items-center">
              <input ref={inputRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a reply…'}
                disabled={sending}
                className="flex-1 outline-none bg-white"
                style={{ border:'1px solid rgba(0,0,0,0.12)', borderRadius:16, padding:'7px 13px', fontSize:'0.78rem', fontFamily:"'DM Sans',sans-serif", color:'#111' }}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.28)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
              />
              <button type="submit" disabled={sending || !replyText.trim()} className="flex-shrink-0 border-none font-bold transition-all duration-150"
                style={{ background: replyText.trim() ? '#111' : 'rgba(0,0,0,0.07)', color: replyText.trim() ? '#fff' : 'rgba(0,0,0,0.25)', borderRadius:16, padding:'7px 15px', fontSize:'0.72rem', cursor: replyText.trim() ? 'pointer' : 'default', fontFamily:"'DM Sans',sans-serif" }}
              >Send</button>
            </form>
          </div>
        ) : (
          <div className="flex-shrink-0 italic" style={{ padding:'10px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', fontSize:'0.72rem', color:'rgba(0,0,0,0.32)', background:'#fafafa' }}>
            Log in to reply.
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── AdminCommentItem ──────────────────────────────────────────────────────────
function AdminCommentItem({ c, currentUserId, onDelete }) {
  const [editing,    setEditing]    = React.useState(false);
  const [editText,   setEditText]   = React.useState(c.content);
  const [saving,     setSaving]     = React.useState(false);
  const [showReply,  setShowReply]  = React.useState(false);
  const [replyText,  setReplyText]  = React.useState('');
  const [replyingTo, setReplyingTo] = React.useState(null);
  const [sending,    setSending]    = React.useState(false);
  const [replies,    setReplies]    = React.useState(c.replies || []);
  const [replyModal, setReplyModal] = React.useState(false);
  const [commentConfirm,  setCommentConfirm]  = React.useState(false);
  const [commentDeleting, setCommentDeleting] = React.useState(false);
  const replyRef = React.useRef(null);
  const isOwner = currentUserId && String(currentUserId) === String(c.user_id);

  const PREVIEW_LIMIT = 3;
  const previewReplies = replies.slice(-PREVIEW_LIMIT);
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
      if (res.data.success) setEditing(false);
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setCommentDeleting(true);
    try {
      const fd = new FormData();
      fd.append('comment_id', c.id);
      fd.append('user_id',    currentUserId);
      const res = await API.post('/comments.php?action=delete', fd);
      if (res.data.success) { onDelete && onDelete(c.id); }
      setCommentConfirm(false);
    } finally { setCommentDeleting(false); }
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
            <div className="font-bold mb-0.5" style={{ fontSize:'0.7rem', color:'#111' }}>{displayName(c)}</div>
            {editing ? (
              <div className="flex flex-col gap-1.5">
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                  className="w-full border rounded-md outline-none resize-none bg-white"
                  style={{ borderColor:'rgba(0,0,0,0.15)', padding:'5px 8px', fontSize:'0.8rem', fontFamily:"'DM Sans',sans-serif" }}
                />
                <div className="flex gap-1.5">
                  <button onClick={saveEdit} disabled={saving} className="bg-gray-900 text-white border-none rounded-md font-bold cursor-pointer" style={{ padding:'3px 10px', fontSize:'0.68rem', fontFamily:"'DM Sans',sans-serif" }}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button onClick={() => { setEditing(false); setEditText(c.content); }} className="border-none rounded-md font-bold cursor-pointer" style={{ background:'rgba(0,0,0,0.07)', color:'rgba(0,0,0,0.5)', padding:'3px 10px', fontSize:'0.68rem', fontFamily:"'DM Sans',sans-serif" }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize:'0.8rem', color:'rgba(0,0,0,0.68)', lineHeight:1.5, wordBreak:'break-word' }}>{c.content}</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-0.5 pl-1">
            <div style={{ fontSize:'0.6rem', color:'rgba(0,0,0,0.28)' }}>{timeAgo(c.created_at)}</div>
            {currentUserId && !editing && (
              <button onClick={toggleReply}
                className="bg-transparent border-none cursor-pointer font-bold transition-colors duration-150"
                style={{ fontSize:'0.6rem', color:'rgba(0,0,0,0.38)', fontFamily:"'DM Sans',sans-serif", padding:'1px 3px' }}
                onMouseEnter={e => e.currentTarget.style.color='#111'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.38)'}
              >Reply</button>
            )}
            {isOwner && !editing && (
              <div className="flex gap-1">
                <button onClick={() => setEditing(true)} title="Edit"
                  className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                  style={{ padding:'1px 3px', color:'rgba(0,0,0,0.3)' }}
                  onMouseEnter={e => e.currentTarget.style.color='#6366f1'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.3)'}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button onClick={() => setCommentConfirm(true)} title="Delete"
                  className="bg-transparent border-none cursor-pointer flex items-center transition-colors duration-150"
                  style={{ padding:'1px 3px', color:'rgba(0,0,0,0.3)' }}
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

          {commentConfirm && ReactDOM.createPortal(
            <div onClick={() => setCommentConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-6"
              style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease forwards' }}>
              <div onClick={e => e.stopPropagation()} className="bg-white flex flex-col"
                style={{ borderRadius:16, maxWidth:380, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.2)', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards', padding:24 }}>
                <div className="mb-1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Delete Comment</div>
                <p style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.5)', lineHeight:1.65, margin:'8px 0 20px' }}>
                  Are you sure you want to delete this comment? This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setCommentConfirm(false)} className="border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'rgba(0,0,0,0.07)', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", color:'rgba(0,0,0,0.5)' }}>
                    Cancel
                  </button>
                  <button onClick={handleDelete} disabled={commentDeleting} className="text-white border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'#ef4444', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>
                    {commentDeleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Preview replies */}
          {previewReplies.map(r => (
            <AdminReplyItem key={r.id} r={r} currentUserId={currentUserId}
              onReplyTo={(id, name) => { setReplyingTo({ id, name }); setShowReply(true); setTimeout(() => replyRef.current?.focus(), 80); }}
              onDelete={id => setReplies(prev => prev.filter(x => x.id !== id))}
              onEdit={(id, text) => setReplies(prev => prev.map(x => x.id === id ? { ...x, content: text } : x))}
            />
          ))}

          {hasMoreReplies && (
            <button onClick={() => setReplyModal(true)}
              className="bg-transparent border-none cursor-pointer font-bold underline transition-colors duration-150 mt-1.5"
              style={{ marginLeft:36, fontSize:'0.64rem', color:'rgba(0,0,0,0.4)', fontFamily:"'DM Sans',sans-serif", textUnderlineOffset:'3px' }}
              onMouseEnter={e => e.currentTarget.style.color='#111'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(0,0,0,0.4)'}
            >
              View all {replies.length} replies
            </button>
          )}

          {/* Inline reply input */}
          {showReply && currentUserId && (
            <div className="mt-2 pl-9">
              {replyingTo && (
                <div className="flex items-center justify-between mb-1.5" style={{ background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.18)', borderRadius:7, padding:'3px 9px' }}>
                  <span className="font-bold" style={{ fontSize:'0.62rem', color:'#6366f1' }}>↩ Replying to {replyingTo.name}</span>
                  <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-transparent border-none cursor-pointer" style={{ fontSize:'0.65rem', color:'rgba(0,0,0,0.35)', lineHeight:1, padding:'0 2px' }}>✕</button>
                </div>
              )}
              <form onSubmit={submitReply} className="flex gap-1.5 items-center">
                <input ref={replyRef} value={replyText} onChange={e => setReplyText(e.target.value)}
                  placeholder={replyingTo ? `Reply to ${replyingTo.name}…` : 'Write a reply…'} disabled={sending}
                  className="flex-1 outline-none"
                  style={{ border:'1px solid rgba(0,0,0,0.12)', borderRadius:16, padding:'5px 12px', fontSize:'0.76rem', fontFamily:"'DM Sans',sans-serif", background:'#f9f9f8', color:'#111' }}
                  onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.28)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                />
                <button type="submit" disabled={sending || !replyText.trim()} className="border-none font-bold transition-all duration-150"
                  style={{ background: replyText.trim() ? '#111' : 'rgba(0,0,0,0.07)', color: replyText.trim() ? '#fff' : 'rgba(0,0,0,0.25)', borderRadius:16, padding:'5px 13px', fontSize:'0.7rem', cursor: replyText.trim() ? 'pointer' : 'default', fontFamily:"'DM Sans',sans-serif" }}
                >Send</button>
                <button type="button" onClick={() => { setShowReply(false); setReplyText(''); setReplyingTo(null); }}
                  className="bg-transparent border-none cursor-pointer" style={{ fontSize:'0.7rem', color:'rgba(0,0,0,0.35)', fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              </form>
            </div>
          )}
        </div>
      </div>

      {replyModal && (
        <AdminReplyModal
          comment={{ ...c, replies }}
          currentUserId={currentUserId}
          onClose={() => setReplyModal(false)}
          onReplyAdded={(commentId, updatedReplies) => setReplies(updatedReplies)}
        />
      )}
    </>
  );
}

// ── AdminCommentSection ───────────────────────────────────────────────────────
function AdminCommentSection({ mediaId }) {
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
  const currentUserId = user?.id ?? null;

  const [open,     setOpen]     = React.useState(false);
  const [comments, setComments] = React.useState([]);
  const [count,    setCount]    = React.useState(0);
  const [loaded,   setLoaded]   = React.useState(false);
  const [text,     setText]     = React.useState('');
  const [sending,  setSending]  = React.useState(false);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
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
    <div style={{ borderTop:'1px solid rgba(0,0,0,0.06)' }}>
      <div className="px-4 py-2">
        <button onClick={toggle} className="bg-transparent border-none cursor-pointer flex items-center gap-1.5 py-1"
          style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.76rem', color:'rgba(0,0,0,0.42)', fontWeight:600 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'No comments'}
          <span style={{ fontSize:'0.6rem', color:'rgba(0,0,0,0.25)', marginLeft:2 }}>{open ? '▲' : '▼'}</span>
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 px-4 pb-3.5">
          {!loaded && <div style={{ fontSize:'0.72rem', color:'rgba(0,0,0,0.28)' }}>Loading…</div>}
          {loaded && comments.length === 0 && (
            <div className="italic" style={{ fontSize:'0.72rem', color:'rgba(0,0,0,0.28)' }}>No comments yet. Be the first!</div>
          )}

          {previewComments.map(c => (
            <AdminCommentItem key={c.id} c={c} currentUserId={currentUserId}
              onDelete={id => { setComments(prev => prev.filter(x => x.id !== id)); setCount(n => n - 1); }}
              onEdit={(id, text) => setComments(prev => prev.map(x => x.id === id ? { ...x, content: text } : x))}
            />
          ))}

          {count > 3 && (
            <button className="bg-transparent border-none cursor-pointer py-0.5 font-bold underline text-left"
              style={{ fontSize:'0.74rem', color:'rgba(0,0,0,0.45)', fontFamily:"'DM Sans',sans-serif", textUnderlineOffset:'3px' }}>
              View all {count} comments
            </button>
          )}

          {currentUserId ? (
            <form onSubmit={submit} className="flex gap-2 items-center mt-0.5">
              <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
                placeholder="Write a comment…" disabled={sending}
                className="flex-1 outline-none"
                style={{ border:'1px solid rgba(0,0,0,0.12)', borderRadius:20, padding:'7px 14px', fontSize:'0.8rem', fontFamily:"'DM Sans',sans-serif", background:'#f9f9f8', color:'#111' }}
                onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.28)'}
                onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
              />
              <button type="submit" disabled={sending || !text.trim()} className="border-none font-bold transition-all duration-150"
                style={{ background: text.trim() ? '#111' : 'rgba(0,0,0,0.07)', color: text.trim() ? '#fff' : 'rgba(0,0,0,0.25)', borderRadius:20, padding:'7px 16px', fontSize:'0.73rem', cursor: text.trim() ? 'pointer' : 'default', fontFamily:"'DM Sans',sans-serif" }}
              >Send</button>
            </form>
          ) : (
            <div className="italic" style={{ fontSize:'0.72rem', color:'rgba(0,0,0,0.32)' }}>Log in to comment.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AlbumGrid ─────────────────────────────────────────────────────────────────
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
    if (movedRef.current) return;
    onImageClick({ src: mediaUrl(item.file_path), caption: item.caption, all: media, currentIdx: idx });
  }

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
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.52)', cursor: 'pointer' }}
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

  return (
    <div>
      <div
        style={{ background: '#f0f0ee', userSelect: 'none', height: 260, position: 'relative', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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
                <img src={mediaUrl(item.file_path)} alt={item.caption}
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

        {media.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 2 }}>
            {media.map((_, i) => (
              <div key={i} onClick={() => setActiveIdx(i)}
                style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.45)', transition: 'all 0.3s ease', cursor: 'pointer' }} />
            ))}
          </div>
        )}

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

// ── AdminFeedPost ─────────────────────────────────────────────────────────────
function AdminFeedPost({ post, baseUrl, onImageClick, animDelay, currentUserId, onDeleted, onEdited }) {
  const isAlbum = post._type === 'album';
  const name    = displayName(post);

  const [editing,   setEditing]   = React.useState(false);
  const [editName,  setEditName]  = React.useState(post.name    || '');
  const [editStory, setEditStory] = React.useState(post.story   || '');
  const [editCap,   setEditCap]   = React.useState(post.caption || '');
  const [saving,    setSaving]    = React.useState(false);
  const [deleting,  setDeleting]  = React.useState(false);
  const [confirm,   setConfirm]   = React.useState(false);
  const [menuOpen,  setMenuOpen]  = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const typeBadgeStyle = {
    background: isAlbum ? 'rgba(99,102,241,0.09)' : post.file_type === 'image' ? 'rgba(22,163,74,0.08)' : post.file_type === 'video' ? 'rgba(99,102,241,0.08)' : 'rgba(217,119,6,0.08)',
    color:      isAlbum ? '#6366f1'               : post.file_type === 'image' ? '#16a34a'               : post.file_type === 'video' ? '#6366f1'               : '#d97706',
  };

  async function saveEdit() {
    setSaving(true);
    try {
      const fd = new FormData();
      if (isAlbum) {
        fd.append('album_id',    post.id);
        fd.append('uploader_id', currentUserId);
        fd.append('name',        editName.trim());
        fd.append('story',       editStory.trim());
        const r = await API.post('/albums.php?action=edit', fd);
        if (r.data.success) { onEdited(post._type, post.id, { name: editName.trim(), story: editStory.trim() }); setEditing(false); }
      } else {
        fd.append('media_id',    post.id);
        fd.append('uploader_id', currentUserId);
        fd.append('caption',     editCap.trim());
        const r = await API.post('/media.php?action=edit', fd);
        if (r.data.success) { onEdited(post._type, post.id, { caption: editCap.trim() }); setEditing(false); }
      }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const fd = new FormData();
      if (isAlbum) {
        fd.append('album_id',    post.id);
        fd.append('uploader_id', currentUserId);
        await API.post('/albums.php?action=delete', fd);
      } else {
        fd.append('media_id',    post.id);
        fd.append('uploader_id', currentUserId);
        await API.post('/media.php?action=delete', fd);
      }
      onDeleted(post._type, post.id);
    } finally { setDeleting(false); setConfirm(false); }
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden"
      style={{ border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 10px rgba(0,0,0,0.04)', animation:'fadeUp 0.5s ease forwards', opacity:0, animationDelay:`${animDelay}s` }}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2.5">
        <Avatar name={name} size={40} />
        <div className="flex-1">
          <div className="font-bold" style={{ fontSize:'0.88rem', color:'#111', fontFamily:"'DM Serif Display',serif" }}>{name}</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span style={{ fontSize:'0.68rem', color:'rgba(0,0,0,0.35)' }}>{timeAgo(post.uploaded_at || post.created_at)}</span>
            <span style={{ color:'rgba(0,0,0,0.15)' }}>·</span>
            <span className="font-black uppercase" style={{ fontSize:'0.54rem', letterSpacing:'0.09em', padding:'1px 7px', borderRadius:20, ...typeBadgeStyle }}>
              {isAlbum ? 'album' : post.file_type}
            </span>
          </div>
        </div>

        {/* Ellipsis menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(o => !o); setConfirm(false); setEditing(false); }}
            className="border-none cursor-pointer flex items-center justify-center transition-colors duration-150"
            style={{ background:'none', padding:'4px 6px', borderRadius:7, color:'rgba(0,0,0,0.35)' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 bg-white overflow-hidden" style={{ top:'calc(100% + 6px)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.12)', zIndex:50, minWidth:148, animation:'scaleIn 0.15s ease forwards' }}>
              <button
                onClick={() => { setEditing(true); setMenuOpen(false); setConfirm(false); }}
                className="w-full border-none flex items-center gap-2.5 transition-colors duration-150 cursor-pointer"
                style={{ background:'none', padding:'10px 16px', fontSize:'0.8rem', fontWeight:600, color:'#111', fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Post
              </button>
              <div style={{ height:'1px', background:'rgba(0,0,0,0.06)', margin:'0 10px' }}/>
              <button
                onClick={() => { setConfirm(true); setMenuOpen(false); setEditing(false); }}
                className="w-full border-none flex items-center gap-2.5 transition-colors duration-150 cursor-pointer"
                style={{ background:'none', padding:'10px 16px', fontSize:'0.8rem', fontWeight:600, color:'#ef4444', fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Delete Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {confirm && ReactDOM.createPortal(
        <div onClick={() => setConfirm(false)} className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease forwards' }}>
          <div onClick={e => e.stopPropagation()} className="bg-white flex flex-col"
            style={{ borderRadius:16, maxWidth:400, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.2)', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards', padding:24 }}>
            <div className="mb-1" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>
              Delete {isAlbum ? 'Album' : 'Post'}
            </div>
            <p style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.5)', lineHeight:1.65, margin:'8px 0 20px' }}>
              Are you sure you want to delete this {isAlbum ? 'album and all its files' : 'post'}? This cannot be undone.
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

      {/* Edit form */}
      {editing && (
        <div className="mx-4 mb-3" style={{ background:'rgba(0,0,0,0.02)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, padding:14 }}>
          {isAlbum ? (
            <>
              <div className="mb-2.5">
                <label className="block mb-1.5" style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.38)' }}>Album Title</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full outline-none bg-white"
                  style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'8px 12px', fontSize:'0.85rem', fontFamily:"'DM Sans',sans-serif" }}
                />
              </div>
              <div className="mb-3">
                <label className="block mb-1.5" style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.38)' }}>Caption / Story</label>
                <textarea value={editStory} onChange={e => setEditStory(e.target.value)} rows={3}
                  className="w-full outline-none bg-white resize-y"
                  style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'8px 12px', fontSize:'0.85rem', fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
                />
              </div>
            </>
          ) : (
            <div className="mb-3">
              <label className="block mb-1.5" style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.38)' }}>Caption</label>
              <textarea value={editCap} onChange={e => setEditCap(e.target.value)} rows={3}
                className="w-full outline-none bg-white resize-y"
                style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'8px 12px', fontSize:'0.85rem', fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}
              />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="text-white border-none rounded-lg font-black uppercase tracking-wider cursor-pointer" style={{ background:'#111', padding:'7px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.08em' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} className="border-none rounded-lg font-bold cursor-pointer" style={{ background:'rgba(0,0,0,0.06)', color:'rgba(0,0,0,0.5)', padding:'7px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Caption */}
      {!editing && (post.caption || post.story || post.name) && <CaptionBlock isAlbum={isAlbum} post={post} />}

      {/* Single image */}
      {!isAlbum && post.file_type === 'image' && (
        <div onClick={() => onImageClick({ src: mediaUrl(post.file_path), caption: post.caption })}
          className="overflow-hidden cursor-zoom-in" style={{ maxHeight:460, background:'#f0f0ee' }}>
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
          <video src={mediaUrl(post.file_path)} controls className="w-full block" style={{ maxHeight:420 }}/>
        </div>
      )}

      {/* Document */}
      {!isAlbum && post.file_type === 'document' && (
        <div className="px-4 pb-3">
          <a href={mediaUrl(post.file_path)} target="_blank" rel="noreferrer"
            className="flex items-center gap-3 no-underline transition-colors duration-150"
            style={{ padding:'11px 14px', background:'#f5f5f3', borderRadius:10, border:'1px solid rgba(0,0,0,0.07)' }}
            onMouseEnter={e => e.currentTarget.style.background='#eceae8'}
            onMouseLeave={e => e.currentTarget.style.background='#f5f5f3'}
          >
            <div className="flex items-center justify-center flex-shrink-0 text-white font-black" style={{ width:34, height:42, background:'#111', borderRadius:4, fontSize:'0.5rem' }}>PDF</div>
            <div>
              <div className="font-semibold" style={{ fontSize:'0.78rem', color:'#111' }}>{post.file_name}</div>
              <div className="mt-0.5" style={{ fontSize:'0.66rem', color:'rgba(0,0,0,0.36)' }}>Click to open document</div>
            </div>
          </a>
        </div>
      )}

      {/* Album grid */}
      {isAlbum && post.media?.length > 0 && (
        <AlbumGrid media={post.media} baseUrl={baseUrl} onImageClick={onImageClick} />
      )}
      {isAlbum && (!post.media || post.media.length === 0) && (
        <div className="text-center" style={{ padding:16, color:'rgba(0,0,0,0.22)', fontSize:'0.78rem' }}>Empty album</div>
      )}

      {/* Comments */}
      {!isAlbum && <AdminCommentSection mediaId={post.id} />}
      {isAlbum && post.media?.length > 0 && <AdminCommentSection mediaId={post.media[0].id} />}
    </div>
  );
}

// ── PhotoCropUpload ───────────────────────────────────────────────────────────
function PhotoCropUpload({ preview, onFile, onClear }) {
  const canvasRef  = React.useRef(null);
  const fileRef    = React.useRef(null);
  const dragging   = React.useRef(false);
  const lastPos    = React.useRef({ x: 0, y: 0 });
  const stateRef   = React.useRef({ offsetX: 0, offsetY: 0, scale: 1, img: null, naturalW: 0, naturalH: 0 });
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const SIZE = 160;
  const RES  = 640;

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = stateRef.current;
    ctx.clearRect(0, 0, RES, RES);
    if (!s.img) return;
    const ratio = RES / SIZE;
    const w = s.naturalW * s.scale * ratio;
    const h = s.naturalH * s.scale * ratio;
    ctx.drawImage(s.img, s.offsetX * ratio, s.offsetY * ratio, w, h);
  }

  function clampOffset(ox, oy, scale) {
    const s = stateRef.current;
    const w = s.naturalW * scale;
    const h = s.naturalH * scale;
    return { x: Math.min(0, Math.max(ox, SIZE - w)), y: Math.min(0, Math.max(oy, SIZE - h)) };
  }

  function loadImage(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const aspect = img.naturalWidth / img.naturalHeight;
      let scale, ox, oy;
      if (aspect > 1) { scale = SIZE / img.naturalHeight; ox = (SIZE - img.naturalWidth * scale) / 2; oy = 0; }
      else { scale = SIZE / img.naturalWidth; ox = 0; oy = (SIZE - img.naturalHeight * scale) / 2; }
      stateRef.current = { offsetX: ox, offsetY: oy, scale, img, naturalW: img.naturalWidth, naturalH: img.naturalHeight };
      draw(); forceUpdate();
    };
    img.src = url;
    onFile(file, () => exportCrop());
  }

  function exportCrop() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
  }

  function onMouseDown(e) { dragging.current = true; lastPos.current = { x: e.clientX, y: e.clientY }; e.preventDefault(); }
  function onMouseMove(e) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x; const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    const s = stateRef.current;
    const clamped = clampOffset(s.offsetX + dx, s.offsetY + dy, s.scale);
    stateRef.current.offsetX = clamped.x; stateRef.current.offsetY = clamped.y; draw();
  }
  function onMouseUp() { dragging.current = false; }
  function onTouchStart(e) { dragging.current = true; lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
  function onTouchMove(e) {
    if (!dragging.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x; const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    const s = stateRef.current;
    const clamped = clampOffset(s.offsetX + dx, s.offsetY + dy, s.scale);
    stateRef.current.offsetX = clamped.x; stateRef.current.offsetY = clamped.y; draw(); e.preventDefault();
  }
  function onTouchEnd() { dragging.current = false; }
  function onWheel(e) {
    e.preventDefault();
    const s = stateRef.current;
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const minScale = Math.max(SIZE / s.naturalW, SIZE / s.naturalH);
    const newScale = Math.max(minScale, Math.min(s.scale + delta, minScale * 4));
    const clamped = clampOffset(s.offsetX, s.offsetY, newScale);
    stateRef.current.scale = newScale; stateRef.current.offsetX = clamped.x; stateRef.current.offsetY = clamped.y; draw();
  }

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const hasImage = !!stateRef.current.img;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative overflow-hidden flex-shrink-0"
        style={{ width:SIZE, height:SIZE, borderRadius:10, border: hasImage ? '1.5px solid rgba(0,0,0,0.15)' : '1.5px dashed rgba(0,0,0,0.18)', background:'#f5f5f3', cursor: hasImage ? 'grab' : 'pointer' }}
        onClick={() => { if (!hasImage) fileRef.current.click(); }}
        onMouseDown={hasImage ? onMouseDown : undefined}
        onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={hasImage ? onTouchStart : undefined}
        onTouchMove={hasImage ? onTouchMove : undefined} onTouchEnd={onTouchEnd}
      >
        <canvas ref={canvasRef} width={RES} height={RES} style={{ display: hasImage ? 'block' : 'none', width:SIZE, height:SIZE, userSelect:'none' }} />
        {!hasImage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span className="text-center" style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.28)', letterSpacing:'0.08em', lineHeight:1.4 }}>CLICK TO<br/>UPLOAD</span>
          </div>
        )}
        {hasImage && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute" style={{ top:'50%', left:0, right:0, height:1, background:'rgba(255,255,255,0.25)' }}/>
            <div className="absolute" style={{ left:'50%', top:0, bottom:0, width:1, background:'rgba(255,255,255,0.25)' }}/>
            <div className="absolute inset-0" style={{ border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:8 }}/>
          </div>
        )}
      </div>

      <div className="flex gap-1.5">
        <button type="button" onClick={() => fileRef.current.click()}
          className="font-bold cursor-pointer"
          style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:6, padding:'5px 12px', fontSize:'0.68rem', fontFamily:"'DM Sans',sans-serif", color:'rgba(0,0,0,0.55)' }}>
          {hasImage ? 'Change' : 'Browse'}
        </button>
        {hasImage && (
          <button type="button" onClick={() => { stateRef.current = { offsetX:0, offsetY:0, scale:1, img:null, naturalW:0, naturalH:0 }; onClear(); forceUpdate(); draw(); }}
            className="font-bold cursor-pointer"
            style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:6, padding:'5px 12px', fontSize:'0.68rem', fontFamily:"'DM Sans',sans-serif", color:'#ef4444' }}>
            Remove
          </button>
        )}
      </div>
      {hasImage
        ? <span style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.3)', letterSpacing:'0.06em' }}>Drag to reposition · Scroll to zoom</span>
        : <span style={{ fontSize:'0.6rem', color:'rgba(0,0,0,0.3)', letterSpacing:'0.06em' }}>1 × 1 photo</span>
      }
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files[0]; if (f) loadImage(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ── MemberCard ────────────────────────────────────────────────────────────────
function MemberCard({ m, baseUrl, userId, spotSlug, onReload, onViewDetail }) {
  const [menuOpen,      setMenuOpen]      = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [editing,       setEditing]       = React.useState(false);
  const [confirm,       setConfirm]       = React.useState(false);
  const [deleting,      setDeleting]      = React.useState(false);
  const [saving,        setSaving]        = React.useState(false);
  const [editName,      setEditName]      = React.useState(m.name);
  const [editPos,       setEditPos]       = React.useState(m.position || '');
  const [editBio,       setEditBio]       = React.useState(m.bio || '');
  const [editPhoto,     setEditPhoto]     = React.useState(null);
  const [preview,       setPreview]       = React.useState(null);
  const [getCropBlob,   setGetCropBlob]   = React.useState(null);
  const [editGender,    setEditGender]    = React.useState(m.gender || '');
  const [editBirthday,  setEditBirthday]  = React.useState(m.birthday || '');
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  async function saveEdit() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('member_id',   m.id);
      fd.append('uploader_id', userId);
      fd.append('spot_slug',   spotSlug);
      fd.append('name',        editName.trim());
      fd.append('position',    editPos.trim());
      fd.append('bio',         editBio.trim());
      fd.append('gender',      editGender.trim());
      fd.append('birthday',    editBirthday);
      if (editPhoto) {
        const blob = getCropBlob ? await getCropBlob() : editPhoto;
        fd.append('photo', blob || editPhoto, 'photo.jpg');
      }
      const r = await API.post('/members.php?action=edit', fd);
      if (r.data.success) { onReload(); setEditing(false); setEditModalOpen(false); setEditPhoto(null); setPreview(null); }
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const fd = new FormData();
      fd.append('member_id',   m.id);
      fd.append('uploader_id', userId);
      await API.post('/members.php?action=delete', fd);
      onReload();
    } finally { setDeleting(false); setConfirm(false); }
  }

  const photoSrc = preview || (m.photo_path ? mediaUrl(m.photo_path) : null);

  return (
    <div className="bg-white overflow-hidden" style={{ border:'1px solid rgba(0,0,0,0.08)', borderRadius:14, boxShadow:'0 2px 10px rgba(0,0,0,0.04)', animation:'fadeUp 0.4s ease forwards', opacity:0 }}>

      {/* Photo banner */}
      <div className="relative overflow-hidden" style={{ width:'100%', height:160, background:'#f0f0ee' }}>
        {photoSrc ? (
          <img src={photoSrc} alt={m.name} className="w-full h-full object-cover block transition-transform duration-300"/>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <span className="uppercase tracking-wider" style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.18)' }}>NO PHOTO</span>
          </div>
        )}

        {/* Ellipsis menu */}
        <div className="absolute" style={{ top:10, right:10 }} ref={menuRef}>
          <button onClick={() => { setMenuOpen(o => !o); setConfirm(false); setEditing(false); }}
            className="flex items-center cursor-pointer transition-colors duration-150"
            style={{ background:'rgba(255,255,255,0.88)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:7, padding:'4px 7px', backdropFilter:'blur(6px)' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,1)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.88)'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(0,0,0,0.5)">
              <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 bg-white overflow-hidden" style={{ top:'calc(100% + 6px)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:10, boxShadow:'0 8px 28px rgba(0,0,0,0.12)', zIndex:50, minWidth:140, animation:'scaleIn 0.15s ease forwards' }}>
              <button onClick={() => { onViewDetail(m, baseUrl); setMenuOpen(false); }}
                className="w-full border-none flex items-center gap-2.5 cursor-pointer transition-colors duration-150"
                style={{ background:'none', padding:'9px 14px', fontSize:'0.78rem', fontWeight:600, color:'#111', fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                View Details
              </button>
              <div style={{ height:'1px', background:'rgba(0,0,0,0.06)', margin:'0 10px' }}/>
              <button onClick={() => { setEditing(true); setEditModalOpen(true); setMenuOpen(false); }}
                className="w-full border-none flex items-center gap-2.5 cursor-pointer transition-colors duration-150"
                style={{ background:'none', padding:'9px 14px', fontSize:'0.78rem', fontWeight:600, color:'#111', fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Member
              </button>
              <div style={{ height:'1px', background:'rgba(0,0,0,0.06)', margin:'0 10px' }}/>
              <button onClick={() => { setConfirm(true); setMenuOpen(false); }}
                className="w-full border-none flex items-center gap-2.5 cursor-pointer transition-colors duration-150"
                style={{ background:'none', padding:'9px 14px', fontSize:'0.78rem', fontWeight:600, color:'#ef4444', fontFamily:"'DM Sans',sans-serif" }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 text-center">
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', fontWeight:400, color:'#111', lineHeight:1.25, wordBreak:'break-word' }}>{m.name}</div>
        {m.position && (
          <div className="font-bold uppercase tracking-wider mt-1" style={{ fontSize:'0.62rem', color:'rgba(0,0,0,0.35)', letterSpacing:'0.12em' }}>{m.position}</div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirm && ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', animation:'fadeIn 0.2s ease forwards' }}>
          <div onClick={e => e.stopPropagation()} className="bg-white" style={{ borderRadius:14, padding:24, maxWidth:400, width:'100%', boxShadow:'0 24px 80px rgba(0,0,0,0.18)', animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div className="mb-2" style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Remove Member</div>
            <p className="mb-5" style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.55)', lineHeight:1.6 }}>
              Are you sure you want to remove <strong>{m.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirm(false)} className="border-none rounded-lg font-bold cursor-pointer" style={{ background:'rgba(0,0,0,0.07)', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="text-white border-none rounded-lg font-bold cursor-pointer" style={{ background:'#ef4444', padding:'8px 18px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>
                {deleting ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}  

      {/* Edit modal */}
      {editing && editModalOpen && ReactDOM.createPortal(
  <div onClick={() => { setEditing(false); setEditModalOpen(false); setEditPhoto(null); setPreview(null); }}
  className="fixed inset-0 flex items-center justify-center"
  style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', animation:'fadeIn 0.2s ease forwards', zIndex:9999, padding:'24px' }}>
    <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col overflow-hidden"
      style={{ borderRadius:16, maxWidth:520, maxHeight:'88vh', boxShadow:'0 24px 80px rgba(0,0,0,0.18)', animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>

            <div className="flex items-center justify-between flex-shrink-0 px-6 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Edit Member</div>
              <button onClick={() => { setEditing(false); setEditModalOpen(false); setEditPhoto(null); setPreview(null); }}
                className="flex items-center justify-center cursor-pointer" style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:7, width:30, height:30, fontSize:'0.85rem' }}>✕</button>
            </div>

            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:16, padding:'20px 20px 8px' }}>
              <div className="flex justify-center">
                {!editPhoto && m.photo_path ? (
                  <div className="flex flex-col items-center gap-2">
                    <div onClick={() => document.getElementById(`edit-photo-input-${m.id}`).click()}
                      className="relative overflow-hidden cursor-pointer flex-shrink-0"
                      style={{ width:160, height:160, borderRadius:10, border:'1.5px solid rgba(0,0,0,0.15)' }}>
                      <img src={mediaUrl(m.photo_path)} alt={m.name} className="w-full h-full object-cover block transition-transform duration-300" />
                      <div className="absolute inset-0 flex items-center justify-center transition-all duration-200"
                        style={{ background:'rgba(0,0,0,0)' }}
                        onMouseEnter={e => { e.currentTarget.style.background='rgba(0,0,0,0.45)'; e.currentTarget.querySelector('span').style.opacity=1; }}
                        onMouseLeave={e => { e.currentTarget.style.background='rgba(0,0,0,0)'; e.currentTarget.querySelector('span').style.opacity=0; }}>
                        <span className="text-center" style={{ opacity:0, color:'#fff', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', lineHeight:1.5, transition:'opacity 0.2s', pointerEvents:'none' }}>CLICK TO<br/>REPLACE</span>
                      </div>
                    </div>
                    <input id={`edit-photo-input-${m.id}`} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files[0]; if (f) { setEditPhoto(f); setPreview(URL.createObjectURL(f)); } e.target.value=''; }}
                    />
                    <span style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.3)', letterSpacing:'0.06em' }}>Click photo to replace</span>
                  </div>
                ) : (
                  <PhotoCropUpload
                    preview={preview}
                    onFile={(file, getBlob) => { setEditPhoto(file); setPreview(URL.createObjectURL(file)); setGetCropBlob(() => getBlob); }}
                    onClear={() => { setEditPhoto(null); setPreview(null); }}
                  />
                )}
              </div>

              <div className="ad-form-grid grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Full Name *</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.45)'}
                    onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Position / Role</label>
                  <input value={editPos} onChange={e => setEditPos(e.target.value)} className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.45)'}
                    onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Gender</label>
                  <select value={editGender} onChange={e => setEditGender(e.target.value)} className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif", color:'#111' }}>
                    <option value=''>— Select —</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Non-binary'>Non-binary</option>
                    <option value='Prefer not to say'>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Birthday</label>
                  <input type="date" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif", color:'#111' }}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Additional Information</label>
                <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} className="w-full outline-none bg-white resize-y"
                  style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif", lineHeight:1.65 }}
                  onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.45)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                />
              </div>
            </div>

            <div className="flex-shrink-0" style={{ padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', background:'#fafafa' }}>
  <button onClick={saveEdit} disabled={saving} className="text-white border-none rounded-lg font-black uppercase tracking-wider cursor-pointer"
    style={{ width:'100%', background:'#111', padding:'12px', fontSize:'0.78rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.08em' }}>
    {saving ? 'Saving…' : 'Save Changes'}
  </button>
</div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── AuthorsPanel ──────────────────────────────────────────────────────────────
function AuthorsPanel({ members, userId, spotSlug, baseUrl, onReload }) {
  const [adding,       setAdding]       = React.useState(false);
  const [saving,       setSaving]       = React.useState(false);
  const [msg,          setMsg]          = React.useState('');
  const [msgOk,        setMsgOk]        = React.useState(false);
  const [newName,      setNewName]      = React.useState('');
  const [newPos,       setNewPos]       = React.useState('');
  const [newBio,       setNewBio]       = React.useState('');
  const [newGender,    setNewGender]    = React.useState('');
  const [newBirthday,  setNewBirthday]  = React.useState('');
  const [newPhoto,     setNewPhoto]     = React.useState(null);
  const [preview,      setPreview]      = React.useState(null);
  const [getCropBlob,  setGetCropBlob]  = React.useState(null);
  const [detailMember,  setDetailMember]  = React.useState(null);
  const [detailBase,    setDetailBase]    = React.useState('');
  const [detailImgZoom, setDetailImgZoom] = React.useState(false);

  function resetForm() { setNewName(''); setNewPos(''); setNewBio(''); setNewGender(''); setNewBirthday(''); setNewPhoto(null); setPreview(null); setGetCropBlob(null); setMsg(''); }

  async function handleAdd() {
    if (!newName.trim()) { setMsg('Name is required.'); setMsgOk(false); return; }
    setSaving(true); setMsg('');
    try {
      const fd = new FormData();
      fd.append('spot_slug',   spotSlug);
      fd.append('uploader_id', userId);
      fd.append('name',        newName.trim());
      fd.append('position',    newPos.trim());
      fd.append('bio',         newBio.trim());
      fd.append('gender',      newGender.trim());
      fd.append('birthday',    newBirthday);
      if (newPhoto) {
        const blob = getCropBlob ? await getCropBlob() : newPhoto;
        fd.append('photo', blob || newPhoto, 'photo.jpg');
      }
      const r = await API.post('/members.php', fd);
      if (r.data.success) {
        setMsgOk(true); setMsg('Member added!');
        resetForm(); setAdding(false);
        onReload();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsgOk(false); setMsg(r.data.message || 'Failed.');
      }
    } finally { setSaving(false); }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1.15rem', color:'#111' }}>Authors & Team</div>
          <div className="mt-0.5" style={{ fontSize:'0.72rem', color:'rgba(0,0,0,0.38)' }}>
            {members.length} member{members.length !== 1 ? 's' : ''} listed
          </div>
        </div>
        <button onClick={() => { setAdding(true); resetForm(); }}
          className="text-white border-none rounded-lg font-black uppercase tracking-wider cursor-pointer transition-all duration-200"
          style={{ background:'#111', padding:'9px 20px', fontSize:'0.7rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.1em' }}>
          + Add Member
        </button>
      </div>

      {members.length === 0 && (
        <div className="bg-white text-center" style={{ borderRadius:14, border:'1px solid rgba(0,0,0,0.07)', padding:'52px 24px' }}>
          <div className="mb-2.5" style={{ fontSize:'2rem', opacity:0.1 }}>👤</div>
          <div style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.28)' }}>No members yet. Click <strong>+ Add Member</strong> to get started.</div>
        </div>
      )}

      <div className="ad-members-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:16 }}>
        {members.map(m => (
          <MemberCard key={m.id} m={m} baseUrl={baseUrl} userId={userId} spotSlug={spotSlug} onReload={onReload}
            onViewDetail={(member, base) => { setDetailMember(member); setDetailBase(base); }}
          />
        ))}
      </div>

      {/* Add Member Modal */}
      {adding && ReactDOM.createPortal(
  <div onClick={() => { setAdding(false); resetForm(); }} className="fixed inset-0 flex items-center justify-center"
  style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', animation:'fadeIn 0.2s ease forwards', zIndex:9999, padding:'24px' }}>
  <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col"
    style={{ borderRadius:16, maxWidth:520, maxHeight:'88vh', boxShadow:'0 24px 80px rgba(0,0,0,0.18)', animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>

            <div className="flex items-center justify-between flex-shrink-0 px-6 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>New Member</div>
              <button onClick={() => { setAdding(false); resetForm(); }}
                className="flex items-center justify-center cursor-pointer" style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:7, width:30, height:30, fontSize:'0.85rem' }}>✕</button>
            </div>

            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:16, padding:'20px 20px 8px' }}>
              <div className="flex justify-center">
                <PhotoCropUpload
                  preview={preview}
                  onFile={(file, getBlob) => { setNewPhoto(file); setPreview(URL.createObjectURL(file)); setGetCropBlob(() => getBlob); }}
                  onClear={() => { setNewPhoto(null); setPreview(null); setGetCropBlob(null); }}
                />
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Full Name *</label>
                  <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Juan dela Cruz" className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.45)'}
                    onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                  />
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Position / Role</label>
                  <input value={newPos} onChange={e => setNewPos(e.target.value)} placeholder="e.g. Photographer" className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif" }}
                    onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.45)'}
                    onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Gender</label>
                  <select value={newGender} onChange={e => setNewGender(e.target.value)} className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif", color:'#111' }}>
                    <option value=''>— Select —</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                    <option value='Non-binary'>Non-binary</option>
                    <option value='Prefer not to say'>Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Birthday</label>
                  <input type="date" value={newBirthday} onChange={e => setNewBirthday(e.target.value)} className="w-full outline-none bg-white"
                    style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif", color:'#111' }}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5" style={{ fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.35)' }}>Additional Information</label>
                <textarea value={newBio} onChange={e => setNewBio(e.target.value)} rows={3} placeholder="Background, contributions, notes…" className="w-full outline-none bg-white resize-y"
                  style={{ border:'1.5px solid rgba(0,0,0,0.12)', borderRadius:7, padding:'9px 12px', fontSize:'0.875rem', fontFamily:"'DM Sans',sans-serif", lineHeight:1.65 }}
                  onFocus={e => e.target.style.borderColor='rgba(0,0,0,0.45)'}
                  onBlur={e  => e.target.style.borderColor='rgba(0,0,0,0.12)'}
                />
              </div>
            </div>

            <div className="flex-shrink-0" style={{ padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', background:'#fafafa' }}>
  {msg && <div className="font-bold mb-2 text-center" style={{ fontSize:'0.74rem', color: msgOk ? '#16a34a' : '#dc2626' }}>{msg}</div>}
  <button onClick={handleAdd} disabled={saving} className="text-white border-none rounded-lg font-black uppercase tracking-wider cursor-pointer"
    style={{ width:'100%', background:'#111', padding:'12px', fontSize:'0.78rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.08em' }}>
    {saving ? 'Adding…' : 'Add Member'}
  </button>
</div>
          </div>
        </div>,
        document.body
      )}

      {/* View Detail Modal */}
      {detailMember && ReactDOM.createPortal(
        <div onClick={() => { setDetailMember(null); setDetailImgZoom(false); }} className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)', animation:'fadeIn 0.2s ease forwards', padding: '12px' }}>
          <div onClick={e => e.stopPropagation()} className="bg-white w-full flex flex-col overflow-hidden"
            style={{ borderRadius:16, maxWidth:580, maxHeight:'90vh', boxShadow:'0 24px 80px rgba(0,0,0,0.18)', animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>

            <div className="flex items-center justify-between flex-shrink-0 px-6 py-4" style={{ borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
              <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1rem', color:'#111' }}>Member Profile</div>
              <button onClick={() => { setDetailMember(null); setDetailImgZoom(false); }}
                className="flex items-center justify-center cursor-pointer" style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:7, width:30, height:30, fontSize:'0.85rem' }}>✕</button>
            </div>

            <div style={{ overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:16, padding:'20px 20px 8px' }}>
              <div className="flex justify-center">
                {detailMember.photo_path ? (
                  <div onClick={() => setDetailImgZoom(true)}
                    className="relative overflow-hidden flex-shrink-0 cursor-zoom-in"
                    style={{ width:160, height:160, borderRadius:10, border:'1.5px solid rgba(0,0,0,0.12)' }}
                    onMouseEnter={e => { e.currentTarget.querySelector('.zoom-overlay').style.background='rgba(0,0,0,0.35)'; e.currentTarget.querySelector('.zoom-label').style.opacity='1'; e.currentTarget.querySelector('img').style.transform='scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.querySelector('.zoom-overlay').style.background='rgba(0,0,0,0)'; e.currentTarget.querySelector('.zoom-label').style.opacity='0'; e.currentTarget.querySelector('img').style.transform='scale(1)'; }}
                  >
                    <img src={mediaUrl(detailMember.photo_path)} alt={detailMember.name} className="w-full h-full object-cover block transition-transform duration-300" />
                    <div className="zoom-overlay absolute inset-0 pointer-events-none transition-all duration-200" style={{ background:'rgba(0,0,0,0)' }} />
                    <span className="zoom-label absolute pointer-events-none transition-opacity duration-200" style={{ bottom:6, right:8, fontSize:'0.55rem', fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.08em', textShadow:'0 1px 4px rgba(0,0,0,0.6)', opacity:0 }}>CLICK TO ZOOM</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2" style={{ width:160, height:160, borderRadius:10, background:'#f0f0ee', border:'1.5px dashed rgba(0,0,0,0.12)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span className="uppercase tracking-wider" style={{ fontSize:'0.58rem', color:'rgba(0,0,0,0.2)' }}>NO PHOTO</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'1.2rem', color:'#111', lineHeight:1.2 }}>{detailMember.name}</div>
                {detailMember.position && <div className="font-bold uppercase tracking-wider mt-1" style={{ fontSize:'0.64rem', color:'rgba(0,0,0,0.35)', letterSpacing:'0.12em' }}>{detailMember.position}</div>}
              </div>

              <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop:'1px solid rgba(0,0,0,0.06)' }}>
                {detailMember.gender && (
                  <div className="flex gap-2.5">
                    <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize:'0.66rem', color:'rgba(0,0,0,0.3)', width:80, letterSpacing:'0.1em' }}>Gender</span>
                    <span style={{ fontSize:'0.82rem', color:'#111' }}>{detailMember.gender}</span>
                  </div>
                )}
                {detailMember.birthday && (
                  <div className="flex gap-2.5">
                    <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize:'0.66rem', color:'rgba(0,0,0,0.3)', width:80, letterSpacing:'0.1em' }}>Birthday</span>
                    <span style={{ fontSize:'0.82rem', color:'#111' }}>{new Date(detailMember.birthday).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
                  </div>
                )}
                {detailMember.bio && (
                  <div className="flex gap-2.5 items-start">
                    <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize:'0.66rem', color:'rgba(0,0,0,0.3)', width:80, letterSpacing:'0.1em' }}>About</span>
                    <span style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.62)', lineHeight:1.7, wordBreak:'break-word' }}>{detailMember.bio}</span>
                  </div>
                )}
                <div className="flex gap-2.5">
                  <span className="font-bold uppercase tracking-wider flex-shrink-0 pt-0.5" style={{ fontSize:'0.66rem', color:'rgba(0,0,0,0.3)', width:80, letterSpacing:'0.1em' }}>Added</span>
                  <span style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.4)' }}>{new Date(detailMember.created_at).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end flex-shrink-0 px-6 py-3.5" style={{ borderTop:'1px solid rgba(0,0,0,0.07)', background:'#fafafa' }} />
          </div>
        </div>,
        document.body
      )}

      {/* Image zoom lightbox */}
      {detailImgZoom && detailMember?.photo_path && ReactDOM.createPortal(
        <div onClick={() => setDetailImgZoom(false)} className="fixed inset-0 flex items-center justify-center cursor-zoom-out"
          style={{ background:'rgba(0,0,0,0.95)', zIndex:1100, backdropFilter:'blur(16px)', animation:'fadeIn 0.2s ease forwards' }}>
          <img src={mediaUrl(detailMember.photo_path)} alt={detailMember.name}
            className="w-full h-full object-contain" style={{ animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
            onClick={e => e.stopPropagation()}
          />
          <button onClick={() => setDetailImgZoom(false)}
            className="absolute top-5 right-6 flex items-center justify-center cursor-pointer"
            style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', color:'#fff', width:36, height:36, borderRadius:'50%', fontSize:'1rem' }}>✕</button>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── AdminDashboard (main) ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');

  const [experience,   setExperience]   = useState('');
  const [expLastSaved, setExpLastSaved] = useState('');
  const [expMsg,       setExpMsg]       = useState('');
  const [savingExp,    setSavingExp]    = useState(false);
  const [expLoading,   setExpLoading]   = useState(true);

  const [mediaDragOver,   setMediaDragOver]   = useState(false);
  const [quickItems,      setQuickItems]       = useState([]);
  const [quickUploading,  setQuickUploading]   = useState(false);
  const [quickMsg,        setQuickMsg]         = useState('');
  const [quickOk,         setQuickOk]          = useState(false);
  const [quickProgress,   setQuickProgress]    = useState(0);
  const quickFileRef = useRef();

  const [albums,          setAlbums]           = useState([]);
  const [albumName,       setAlbumName]        = useState('');
  const [albumStory,      setAlbumStory]       = useState('');
  const [expandedAlbum,   setExpandedAlbum]    = useState(null);
  const [uploadModalOpen, setUploadModalOpen]  = useState(false);

  const [media,    setMedia]    = useState([]);
  const [filter,   setFilter]   = useState('All');
  const [feed,     setFeed]     = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [members,  setMembers]  = useState([]);
const [ratings,  setRatings]  = useState([]);
const [ratingsSummary, setRatingsSummary] = useState(null);
const [activeTab, setActiveTab] = useState('posts');

  const [modal,      setModal]      = useState(null);
const uploadOverlayRef = useRef(null);

useEffect(() => {
  const el = uploadOverlayRef.current;
  if (!el) return;
  const prevent = (e) => {
    if (!e.target.closest('[data-scrollable]')) e.preventDefault();
  };
  el.addEventListener('touchmove', prevent, { passive: false });
  return () => el.removeEventListener('touchmove', prevent);
}, [uploadModalOpen]);
  const [fullscreen, setFullscreen] = useState(false);
  const [folderModal, setFolderModal] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadMedia();
      loadExperience();
      loadMembers();
      loadRatings();
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false);
        else setModal(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fullscreen]);

  useEffect(() => {
    const anyOpen = !!(modal || lightbox || uploadModalOpen || folderModal);
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    document.body.style.touchAction = anyOpen ? 'none' : '';
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [modal, lightbox, uploadModalOpen, folderModal]);

  if (!user || user.role !== 'admin') {
    return (
      <>
        <style>{css}</style>
        <div className="min-h-screen flex items-center justify-center" style={{ background:'#f5f5f3', fontFamily:"'DM Sans',sans-serif" }}>
          <div className="text-center" style={{ color:'rgba(0,0,0,0.25)' }}>
            <div className="mb-3.5" style={{ fontSize:'2.5rem', opacity:0.3 }}>⊘</div>
            <div className="font-black uppercase tracking-widest" style={{ fontSize:'0.72rem', letterSpacing:'0.2em' }}>ACCESS DENIED — ADMINS ONLY</div>
          </div>
        </div>
      </>
    );
  }

  const loadMembers = () => {
    API.get(`/members.php?slug=${user.assigned_spot}&uploader_id=${user.id}`).then(r => setMembers(r.data));
  };

  const loadRatings = () => {
    API.get(`/ratings.php?slug=${user.assigned_spot}&user_id=0`).then(r => {
      setRatings(r.data.ratings || []);
      setRatingsSummary(r.data.summary || null);
    });
  };

  const loadMedia = () => {
    Promise.all([
      API.get(`/media.php?slug=${user.assigned_spot}`),
      API.get(`/albums.php?slug=${user.assigned_spot}&uploader_id=${user.id}`),
    ]).then(([mediaRes, albumsRes]) => {
      const mediaItems = mediaRes.data.map(m => ({ ...m, _type:'media' }));
      const albumItems = albumsRes.data.map(a => ({ ...a, _type:'album' }));
      const merged = [...mediaItems, ...albumItems].sort((a, b) =>
        new Date(b.uploaded_at || b.created_at) - new Date(a.uploaded_at || a.created_at)
      );
      setMedia(mediaRes.data);
      setAlbums(albumsRes.data);
      setFeed(merged);
    });
  };

  const loadExperience = async () => {
    setExpLoading(true);
    try {
      const res = await API.get(`/experience.php?slug=${user.assigned_spot}&uploader_id=${user.id}`);
      if (res.data.content) { setExperience(res.data.content); setExpLastSaved(res.data.updated_at || ''); }
    } catch {}
    finally { setExpLoading(false); }
  };

  const saveExperience = async () => {
    if (!experience.trim()) { setExpMsg('Please write something first.'); return; }
    setSavingExp(true); setExpMsg('');
    try {
      const fd = new FormData();
      fd.append('spot_slug',   user.assigned_spot);
      fd.append('uploader_id', user.id);
      fd.append('content',     experience);
      const res = await API.post('/experience.php', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setExpMsg('Saved!');
        setExpLastSaved(new Date().toISOString());
        setTimeout(() => setExpMsg(''), 3000);
      } else {
        setExpMsg(res.data.message || 'Failed to save.');
      }
    } catch { setExpMsg('Error saving.'); }
    finally { setSavingExp(false); }
  };

  const addQuickFiles = (newFiles) => {
    const items = Array.from(newFiles).map(file => ({
      file,
      caption: '',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setQuickItems(prev => [...prev, ...items]);
  };

  const removeQuickFile    = (idx) => setQuickItems(prev => prev.filter((_, i) => i !== idx));
  const updateQuickCaption = (idx, val) => setQuickItems(prev => prev.map((item, i) => i === idx ? { ...item, caption: val } : item));

  const uploadQuickFiles = async () => {
    if (quickItems.length === 0) return;
    if (!albumName.trim()) { setQuickMsg('Please enter an album name.'); return; }
    setQuickUploading(true); setQuickMsg(''); setQuickProgress(0);
    try {
      const fd = new FormData();
      quickItems.forEach(item => { fd.append('files[]', item.file); fd.append('captions[]', item.caption || ''); });
      fd.append('spot_slug',   user.assigned_spot);
      fd.append('uploader_id', user.id);
      fd.append('album_name',  albumName.trim());
      fd.append('album_story', albumStory.trim());
      const res = await API.post('/albums.php', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setQuickProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      if (res.data.success) {
        setQuickOk(true); setQuickMsg(res.data.message);
        setQuickItems([]); setAlbumName(''); setAlbumStory('');
        loadMedia();
        setTimeout(() => setUploadModalOpen(false), 1000);
      } else {
        setQuickOk(false); setQuickMsg(res.data.message || 'Upload failed.');
      }
    } catch (err) {
      setQuickOk(false); setQuickMsg('Upload failed. Check console.'); console.error(err);
    } finally { setQuickUploading(false); }
  };

  const openModal = (m) => {
    setModal({ src: mediaUrl(m.file_path), caption: m.caption, type: m.file_type, fileName: m.file_name });
    setFullscreen(false);
  };

  const spotLabel = spotNames[user.assigned_spot] || user.assigned_spot;

  return (
    <>
      <style>{css}</style>
      <div className="min-h-screen" style={{ fontFamily:"'DM Sans', sans-serif", background:'#f5f5f3' }}>

        {/* ── ANIMATED BACKGROUND ── */}
        <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex:0, opacity:0.9 }} viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
          <circle cx="1100" cy="100" r="220" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="1"/>
          <circle cx="1100" cy="100" r="140" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="1"/>
          <circle cx="100"  cy="800" r="260" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
          <circle cx="100"  cy="800" r="160" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
          <circle cx="600"  cy="450" r="350" fill="none" stroke="rgba(0,0,0,.025)" strokeWidth="1"/>
          <line x1="0" y1="450" x2="1200" y2="450" stroke="rgba(0,0,0,.03)" strokeWidth="1"/>
          <line x1="600" y1="0" x2="600" y2="900" stroke="rgba(0,0,0,.03)" strokeWidth="1"/>
          <line x1="0" y1="0" x2="1200" y2="900" stroke="rgba(0,0,0,.02)" strokeWidth="1"/>
          <line x1="1200" y1="0" x2="0" y2="900" stroke="rgba(0,0,0,.02)" strokeWidth="1"/>
          <path d="M 1100 100 Q 600 300 100 800" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="1" strokeDasharray="6 8" style={{ animation:'dash 12s linear infinite' }}/>
          <rect x="1010" y="30" width="80" height="80" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="1" style={{ animation:'spinSlow 20s linear infinite', transformOrigin:'1050px 70px' }}/>
          <rect x="1020" y="40" width="60" height="60" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="1" style={{ animation:'spinReverse 20s linear infinite', transformOrigin:'1050px 70px' }}/>
          <rect x="30" y="710" width="70" height="70" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="1" style={{ animation:'spinSlow 25s linear infinite', transformOrigin:'65px 745px' }}/>
          <rect x="40" y="720" width="50" height="50" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1" style={{ animation:'spinReverse 25s linear infinite', transformOrigin:'65px 745px' }}/>
          <circle cx="120"  cy="140" r="4" fill="rgba(0,0,0,.18)" style={{ animation:'pulse 3s ease infinite, floatY 6s ease infinite' }}/>
          <circle cx="1080" cy="520" r="3" fill="rgba(0,0,0,.13)" style={{ animation:'pulse 4s ease 0.8s infinite, floatY 7s ease 1s infinite' }}/>
          <circle cx="580"  cy="820" r="5" fill="rgba(0,0,0,.1)"  style={{ animation:'pulse 3.5s ease 0.4s infinite, floatY 5s ease 0.5s infinite' }}/>
          <circle cx="320"  cy="380" r="2.5" fill="rgba(0,0,0,.13)" style={{ animation:'pulse 5s ease 1.2s infinite' }}/>
          <circle cx="880"  cy="260" r="3.5" fill="rgba(0,0,0,.11)" style={{ animation:'pulse 4.5s ease 2s infinite, floatY 8s ease 2s infinite' }}/>
          <path d="M 8 8 L 28 8 L 28 28" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5"/>
          <path d="M 1192 8 L 1172 8 L 1172 28" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5"/>
          <path d="M 8 892 L 28 892 L 28 872" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5"/>
          <path d="M 1192 892 L 1172 892 L 1172 872" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.5"/>
        </svg>

        {/* ── HEADER ── */}
        <div className="relative z-10" style={{ padding:'48px 0 44px', borderBottom:'1px solid rgba(255,255,255,0.08)', background:`linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.72)), url('/images/spots/${user.assigned_spot}.jpg') center/cover no-repeat` }}>
          <div className="ad-header-inner mx-auto px-10" style={{ maxWidth:'1240px' }}>

            <div className="flex items-center gap-3 mb-8" style={{ animation:'fadeUp 0.6s ease 0s forwards', opacity:0 }}>
              <span className="font-black uppercase tracking-widest" style={{ fontSize:'0.85rem', letterSpacing:'0.2em', color:'rgba(255,255,255,0.75)' }}>Admin</span>
            </div>

            <div className="flex items-end justify-between flex-wrap gap-5" style={{ animation:'fadeUp 0.6s ease 0.1s forwards', opacity:0 }}>
              <div>
                <p className="font-bold uppercase tracking-widest mb-2" style={{ fontSize:'0.62rem', letterSpacing:'0.22em', color:'rgba(255,255,255,0.3)' }}>
                  Managing Spot
                </p>
                <h1 className="text-white m-0" style={{ fontFamily:"'DM Serif Display', serif", fontSize:'clamp(2rem, 4vw, 3rem)', fontWeight:400, letterSpacing:'-0.02em', lineHeight:1.1 }}>
                  {spotLabel}
                </h1>
                <p className="mt-3 mb-0" style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.45)', maxWidth:'480px', lineHeight:1.8 }}>
                  {descMap[user.assigned_spot]}
                </p>
              </div>

              <div style={{ animation:'fadeUp 0.6s ease 0.18s forwards', opacity:0 }} />
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="ad-content-wrap relative z-10 mx-auto px-10" style={{ maxWidth:'1240px', paddingTop:'36px', paddingBottom:'80px' }}>
          <div className="ad-main-grid" style={{ display:'grid', gridTemplateColumns:'420px 1fr', gap:'28px', alignItems:'start' }}>

            {/* ── LEFT: DOCUMENTARY ── */}
            <div style={{ animation:'fadeUp 0.6s ease 0.2s forwards', opacity:0 }}>
              <div className="ad-left-col bg-white overflow-hidden" style={{ border:'1px solid rgba(0,0,0,0.08)', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,0.05)', position:'sticky', top:24 }}>
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                  <div>
                    <div style={{ fontFamily:"'DM Serif Display', serif", fontSize:'1.1rem', fontWeight:400, color:'#111', letterSpacing:'-0.01em' }}>Documentary</div>
                    <div className="mt-0.5" style={{ fontSize:'0.75rem', color:'rgba(0,0,0,0.4)' }}>Your personal experience at this spot</div>
                  </div>
                  {expLastSaved && (
                    <span className="italic text-right" style={{ fontSize:'0.65rem', color:'rgba(0,0,0,0.28)' }}>
                      Saved<br/>{new Date(expLastSaved).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="p-6">
                  <label className="block mb-2 font-bold uppercase tracking-wider" style={{ fontSize:'0.68rem', color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em' }}>Your Experience</label>

                  {expLoading ? (
                    <div className="flex items-center justify-center rounded-xl" style={{ height:240, background:'#f5f5f3', border:'1.5px solid rgba(0,0,0,0.08)' }}>
                      <span className="uppercase tracking-wider" style={{ fontSize:'0.75rem', color:'rgba(0,0,0,0.25)' }}>Loading…</span>
                    </div>
                  ) : (
                    <textarea
                      className="cv-input"
                      value={experience}
                      onChange={e => { setExperience(e.target.value); setExpMsg(''); }}
                      placeholder={`Write about your experience at ${spotLabel}…`}
                      rows={12}
                      style={{ minHeight:240, lineHeight:1.75, fontSize:'0.875rem', borderRadius:10 }}
                    />
                  )}

                  <div className="flex items-center gap-3 mt-3.5">
                    <button onClick={saveExperience} disabled={savingExp || expLoading}
                      className="border-none rounded-lg font-black uppercase tracking-wider cursor-pointer transition-all duration-200"
                      style={{ background:'#111', color:'#fff', padding:'10px 22px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.1em' }}>
                      {savingExp ? 'Saving…' : 'Save Changes'}
                    </button>
                    {expMsg && (
                      <span className="font-bold" style={{ fontSize:'0.75rem', color: expMsg === 'Saved!' ? '#16a34a' : '#dc2626' }}>{expMsg}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: TABS ── */}
            <div className="flex flex-col gap-4" style={{ animation:'fadeUp 0.6s ease 0.28s forwards', opacity:0 }}>

              {/* Tab switcher */}
              <div className="flex gap-0 bg-white p-1 rounded-xl" style={{ border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                {[
                  { key:'posts',   label:'Posts',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
                  { key:'authors', label:'Authors', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                  { key:'ratings', label:'Ratings', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
                ].map(t => (

                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    className="flex-1 flex items-center justify-center gap-1.5 border-none rounded-lg font-black uppercase tracking-wider cursor-pointer transition-all duration-200"
                    style={{ background: activeTab === t.key ? '#111' : 'transparent', color: activeTab === t.key ? '#fff' : 'rgba(0,0,0,0.4)', padding:'10px 0', fontSize:'0.72rem', letterSpacing:'0.1em', fontFamily:"'DM Sans',sans-serif" }}
                  >{t.icon}<span className="ad-tab-label">{t.label}</span></button>
                ))}
              </div>

              {/* Posts tab */}
              {activeTab === 'posts' && <>
                <div className="flex justify-end">
                  <button onClick={() => { setQuickItems([]); setAlbumName(''); setAlbumStory(''); setQuickMsg(''); setUploadModalOpen(true); }}
                    className="border-none rounded-lg font-black uppercase tracking-wider cursor-pointer transition-all duration-200"
                    style={{ background:'#111', color:'#fff', padding:'10px 22px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.1em' }}>
                    + New Post
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {feed.length === 0 && (
                    <div className="bg-white text-center" style={{ borderRadius:14, border:'1px solid rgba(0,0,0,0.07)', padding:'52px 24px' }}>
                      <div className="mb-2.5" style={{ fontSize:'2rem', opacity:0.1 }}>📷</div>
                      <div style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.28)' }}>No posts yet. Click <strong>+ New Post</strong> to get started.</div>
                    </div>
                  )}
                  {feed.map((post, i) => (
                    <AdminFeedPost
                      key={`${post._type}-${post.id}`}
                      post={post} baseUrl={BASE}
                      onImageClick={setLightbox}
                      animDelay={i * 0.05}
                      currentUserId={user.id}
                      onDeleted={(type, id) => setFeed(prev => prev.filter(p => !(p._type === type && p.id === id)))}
                      onEdited={(type, id, changes) => setFeed(prev => prev.map(p => p._type === type && p.id === id ? { ...p, ...changes } : p))}
                    />
                  ))}
                </div>
              </>}

              {/* Ratings tab */}
              {activeTab === 'ratings' && (
                <div className="flex flex-col gap-4">
                  {ratingsSummary && parseInt(ratingsSummary.total || 0) > 0 && (
                    <div className="bg-white rounded-2xl p-6" style={{ border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
                      <div className="ad-ratings-bar flex gap-6 items-center flex-wrap">
                        <div className="text-center flex-shrink-0">
                          <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'3.5rem', fontWeight:400, color:'#111', lineHeight:1 }}>
                            {parseFloat(ratingsSummary.average || 0).toFixed(1)}
                          </div>
                          <div className="flex gap-1 justify-center mt-1">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} width="18" height="18" viewBox="0 0 24 24" fill={Math.round(parseFloat(ratingsSummary.average||0)) >= s ? '#f59e0b' : 'none'} stroke={Math.round(parseFloat(ratingsSummary.average||0)) >= s ? '#f59e0b' : 'rgba(0,0,0,0.18)'} strokeWidth="1.8">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            ))}
                          </div>
                          <div className="mt-1" style={{ fontSize:'0.65rem', color:'rgba(0,0,0,0.35)' }}>{ratingsSummary.total} rating{ratingsSummary.total !== 1 ? 's' : ''}</div>
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5" style={{ minWidth:160 }}>
                          {[5,4,3,2,1].map(star => {
                            const count = parseInt(ratingsSummary[`s${star}`] || 0);
                            const total = parseInt(ratingsSummary.total || 0);
                            const pct = total > 0 ? (count / total) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="font-bold text-right flex-shrink-0" style={{ fontSize:'0.65rem', color:'rgba(0,0,0,0.4)', width:8 }}>{star}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1.5" className="flex-shrink-0">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                                <div className="flex-1 overflow-hidden rounded-full" style={{ height:6, background:'rgba(0,0,0,0.07)' }}>
                                  <div style={{ height:'100%', width:`${pct}%`, background:'#f59e0b', borderRadius:3, transition:'width 0.5s ease' }}/>
                                </div>
                                <span className="text-right flex-shrink-0" style={{ fontSize:'0.6rem', color:'rgba(0,0,0,0.3)', width:20 }}>{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {ratings.length === 0 && (
                    <div className="bg-white text-center" style={{ borderRadius:14, border:'1px solid rgba(0,0,0,0.07)', padding:'52px 24px' }}>
                      <div className="mb-2.5" style={{ fontSize:'2rem', opacity:0.1 }}>⭐</div>
                      <div style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.28)' }}>No ratings yet for this spot.</div>
                    </div>
                  )}

                  {ratings.map(r => {
                    const name = [r.first_name, r.last_name].filter(Boolean).join(' ') || r.username || 'Unknown';
                    const colors = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899'];
                    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
                    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
                    return (
                      <div key={r.id} className="bg-white rounded-xl p-4" style={{ border:'1px solid rgba(0,0,0,0.08)', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-1">
                            <div style={{ width:34, height:34, borderRadius:'50%', background:color, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34*0.36, fontWeight:700, flexShrink:0 }}>{initials}</div>
                            <div>
                              <div className="font-bold" style={{ fontSize:'0.82rem', color:'#111', fontFamily:"'DM Serif Display',serif" }}>{name}</div>
                              <div className="mt-0.5" style={{ fontSize:'0.6rem', color:'rgba(0,0,0,0.3)' }}>
                                {new Date(r.updated_at || r.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {[1,2,3,4,5].map(s => (
                              <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={r.stars >= s ? '#f59e0b' : 'none'} stroke={r.stars >= s ? '#f59e0b' : 'rgba(0,0,0,0.18)'} strokeWidth="1.8">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                              </svg>
                            ))}
                          </div>
                        </div>
                        {r.feedback && (
                          <div className="mt-2.5" style={{ fontSize:'0.82rem', color:'rgba(0,0,0,0.62)', lineHeight:1.7, wordBreak:'break-word' }}>{r.feedback}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Authors tab */}
              {activeTab === 'authors' && (
                <AuthorsPanel
                  members={members} userId={user.id}
                  spotSlug={user.assigned_spot} baseUrl={BASE}
                  onReload={loadMembers}
                />
              )}
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
          const curSrc = cur?.file_path ? mediaUrl(cur.file_path) : (cur?.src || lightbox.src);
          const curCap = cur?.caption || '';
          const setIdx = (i) => setLightbox({ ...lightbox, currentIdx: (i + all.length) % all.length });

          return (
            <div className="fixed inset-0 flex flex-col items-center justify-center cursor-zoom-out"
              style={{ background:'rgba(0,0,0,0.88)', zIndex:999, padding:32, backdropFilter:'blur(10px)' }}
              onClick={() => setLightbox(null)}
              tabIndex={0} ref={el => el?.focus()}
              onKeyDown={e => { if (e.key==='ArrowLeft') { e.stopPropagation(); setIdx(ci-1); } if (e.key==='ArrowRight') { e.stopPropagation(); setIdx(ci+1); } }}
              onTouchMove={e => e.preventDefault()}
            >
              <img src={curSrc} alt={curCap}
                style={{ maxWidth:'90vw', maxHeight:'80vh', objectFit:'contain', borderRadius:8, animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                onClick={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onTouchMove={e => { e.stopPropagation(); e.preventDefault(); }}
                onTouchEnd={e => e.stopPropagation()}
              />
              {curCap && (
                <div className="mt-4 text-center" style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.84rem', maxWidth:520, lineHeight:1.6 }}>{curCap}</div>
              )}

              {all.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); setIdx(ci-1); }}
                    className="absolute flex items-center justify-center cursor-pointer transition-all duration-150"
                    style={{ left:20, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.25)', color:'#fff' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <button onClick={e => { e.stopPropagation(); setIdx(ci+1); }}
                    className="absolute flex items-center justify-center cursor-pointer transition-all duration-150"
                    style={{ right:20, top:'50%', transform:'translateY(-50%)', width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.25)', color:'#fff' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.22)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                  <div className="absolute" style={{ bottom:24, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.45)', borderRadius:20, padding:'3px 12px', fontSize:'0.68rem', color:'rgba(255,255,255,0.85)', fontWeight:700 }}>
                    {ci+1} / {all.length}
                  </div>
                </>
              )}

              <button onClick={() => setLightbox(null)}
                className="absolute top-5 right-6 flex items-center justify-center cursor-pointer"
                style={{ background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', color:'#fff', width:36, height:36, borderRadius:'50%', fontSize:'1rem' }}>✕</button>
            </div>
          );
        })()}

        {/* ── FOLDER MODAL ── */}
        {folderModal && (
          <div className="modal-overlay" onClick={() => setFolderModal(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth:'780px', maxHeight:'88vh', height:'auto' }}>
              <div className="modal-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div className="flex items-center gap-2.5" style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize:'0.88rem', fontWeight:800, color:'#111', fontFamily:"'DM Serif Display',serif" }}>{folderModal.name}</span>
                  <span className="font-black uppercase" style={{ fontSize:'0.55rem', letterSpacing:'0.08em', padding:'2px 8px', borderRadius:20, background:'rgba(0,0,0,0.07)', color:'rgba(0,0,0,0.45)' }}>
                    {folderModal.file_count} file{folderModal.file_count !== 1 ? 's' : ''}
                  </span>
                </div>
                <button onClick={() => setFolderModal(null)} className="border-none rounded-lg font-bold cursor-pointer transition-all duration-200"
                  style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.12)', color:'#111', padding:'6px 10px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif" }}>✕</button>
              </div>
              {folderModal.story && (
                <div className="px-5 py-3" style={{ borderBottom:'1px solid rgba(0,0,0,0.06)', fontSize:'0.82rem', color:'rgba(0,0,0,0.45)', lineHeight:1.7 }}>
                  {folderModal.story}
                </div>
              )}
              <div className="p-5 overflow-y-auto flex-1">
                {folderModal.media?.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:12 }}>
                    {folderModal.media.map(m => (
                      <div key={m.id} className="media-thumb" onClick={() => { setFolderModal(null); openModal(m); }}>
                        {m.file_type === 'image' && (
                          <div className="overflow-hidden" style={{ height:100, borderRadius:'8px 8px 0 0' }}>
                            <img src={mediaUrl(m.file_path)} alt={m.caption}
                              className="w-full h-full object-cover block transition-transform duration-300"
                              onMouseEnter={e => e.currentTarget.style.transform='scale(1.06)'}
                              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
                            />
                          </div>
                        )}
                        {m.file_type === 'video' && (
                          <div className="flex items-center justify-center flex-col gap-1.5" style={{ height:100, background:'#1a1a1a', borderRadius:'8px 8px 0 0' }}>
                            <div className="flex items-center justify-center" style={{ width:30, height:30, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.4)' }}>
                              <div style={{ width:0, height:0, borderTop:'5px solid transparent', borderBottom:'5px solid transparent', borderLeft:'9px solid rgba(255,255,255,0.7)', marginLeft:2 }}/>
                            </div>
                          </div>
                        )}
                        {m.file_type === 'document' && (
                          <div className="flex items-center justify-center flex-col gap-1.5" style={{ height:100, background:'#f5f5f3', borderRadius:'8px 8px 0 0' }}>
                            <div className="flex items-center justify-center text-white font-black" style={{ width:28, height:34, background:'#111', borderRadius:3, fontSize:'0.44rem' }}>PDF</div>
                          </div>
                        )}
                        <div style={{ padding:'7px 10px' }}>
                          <div style={{ fontSize:'0.68rem', color:'rgba(0,0,0,0.55)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {m.caption || <span className="italic" style={{ color:'rgba(0,0,0,0.25)' }}>No caption</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10" style={{ color:'rgba(0,0,0,0.25)', fontSize:'0.82rem' }}>No files in this folder.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── UPLOAD MODAL ── */}
{uploadModalOpen && (
  <div ref={uploadOverlayRef} className="modal-overlay" onClick={() => setUploadModalOpen(false)} style={{ zIndex:9999, alignItems:'flex-end', padding:0 }}
    onWheel={e => e.stopPropagation()}
  >
    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth:'520px', width:'100%', maxHeight:'92dvh', height:'auto', display:'flex', flexDirection:'column', borderRadius:'16px 16px 0 0', margin:0 }}>
      
      {/* Header */}
      <div className="modal-toolbar" style={{ padding:'14px 16px', flexShrink:0 }}>
        <div className="flex items-center gap-2" style={{ flex:1, minWidth:0 }}>
          <span style={{ fontSize:'0.95rem', fontWeight:800, color:'#111', fontFamily:"'DM Serif Display',serif" }}>New Post</span>
          {quickItems.length > 0 && (
            <span style={{ fontSize:'0.55rem', fontWeight:900, letterSpacing:'0.08em', padding:'2px 8px', borderRadius:20, background:'rgba(0,0,0,0.07)', color:'rgba(0,0,0,0.45)', textTransform:'uppercase' }}>
              {quickItems.length} file{quickItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          
          <button onClick={() => setUploadModalOpen(false)}
            style={{ background:'rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.1)', color:'#111', width:34, height:34, borderRadius:'50%', fontSize:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>✕</button>
        </div>
      </div>

      {/* Scrollable body */}
      <div data-scrollable style={{ flex:1, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>

        {/* File grid — max 2 rows visible, scrollable */}
        {quickItems.length > 0 && (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, maxHeight:280, overflowY:'auto', paddingRight:2 }}>
              {quickItems.map((item, idx) => (
                <div key={idx} style={{ border:'1px solid rgba(0,0,0,0.08)', borderRadius:10, background:'#fafafa', overflow:'hidden' }}>
                  {item.preview ? (
                    <div style={{ position:'relative', height:110 }}>
                      <img src={item.preview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                      <button onClick={() => removeQuickFile(idx)}
                        style={{ position:'absolute', top:5, right:5, background:'rgba(0,0,0,0.6)', border:'none', width:22, height:22, borderRadius:'50%', color:'#fff', fontSize:'0.65rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ position:'relative', height:70, background:'#f0f0ee', display:'flex', alignItems:'center', gap:8, padding:'0 10px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ width:24, height:30, background:'#111', borderRadius:3, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'0.44rem', fontWeight:900, flexShrink:0 }}>
                        {item.file.name.split('.').pop().toUpperCase().slice(0,4)}
                      </div>
                      <div style={{ fontSize:'0.66rem', color:'rgba(0,0,0,0.5)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{item.file.name}</div>
                      <button onClick={() => removeQuickFile(idx)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'rgba(0,0,0,0.35)', fontSize:'0.8rem', flexShrink:0 }}>✕</button>
                    </div>
                  )}
                  <div style={{ padding:'6px 8px' }}>
                    <textarea
                      className="cv-input"
                      value={item.caption}
                      onChange={e => { updateQuickCaption(idx, e.target.value); e.target.style.height='auto'; e.target.style.height=e.target.scrollHeight+'px'; }}
                      placeholder="Caption…" rows={1}
                      style={{ fontSize:'0.72rem', padding:'5px 8px', resize:'none', overflow:'hidden', lineHeight:1.5, minHeight:28, borderRadius:6 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {quickItems.length > 2 && (
              <div style={{ textAlign:'center', fontSize:'0.62rem', color:'rgba(0,0,0,0.3)', marginTop:4, fontWeight:600 }}>
                Scroll to see all {quickItems.length} files
              </div>
            )}
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`drop-zone${mediaDragOver ? ' dragover' : ''}`}
          onClick={() => quickFileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setMediaDragOver(true); }}
          onDragLeave={() => setMediaDragOver(false)}
          onDrop={e => { e.preventDefault(); setMediaDragOver(false); if (e.dataTransfer.files.length) addQuickFiles(e.dataTransfer.files); }}
          style={{ borderRadius:10, padding:'16px 12px' }}
        >
          <input ref={quickFileRef} type="file" multiple accept="image/*,application/pdf,video/mp4" className="hidden"
            onChange={e => addQuickFiles(e.target.files)}
          />
          <div className="flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" strokeLinecap="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            <span style={{ fontSize:'0.78rem', color:'rgba(0,0,0,0.45)', fontWeight:600 }}>
              {quickItems.length > 0 ? 'Add more files' : 'Tap to browse or drag files'}
            </span>
          </div>
          <div style={{ fontSize:'0.62rem', color:'rgba(0,0,0,0.28)', marginTop:4 }}>JPG · PNG · PDF · MP4</div>
        </div>

        {/* Title */}
        <div>
          <label style={{ display:'block', marginBottom:6, fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.38)' }}>
            Title {quickItems.length > 1 ? '(folder name)' : ''} *
          </label>
          <input className="cv-input" value={albumName} onChange={e => setAlbumName(e.target.value)}
            placeholder="e.g. Morning at Ili-Likha" style={{ borderRadius:8 }}
          />
        </div>

        {/* Caption */}
        <div>
          <label style={{ display:'block', marginBottom:6, fontSize:'0.62rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(0,0,0,0.38)' }}>Caption</label>
          <textarea className="cv-input" value={albumStory} onChange={e => setAlbumStory(e.target.value)}
            placeholder="Write the story behind this upload…" rows={4}
            style={{ lineHeight:1.75, borderRadius:8 }}
          />
        </div>

        {/* Progress */}
        {quickUploading && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(0,0,0,0.4)' }}>Uploading…</span>
              <span style={{ fontSize:'0.65rem', fontWeight:700, color:'rgba(0,0,0,0.5)' }}>{quickProgress}%</span>
            </div>
            <div style={{ height:5, background:'rgba(0,0,0,0.07)', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${quickProgress}%`, background:'#111', borderRadius:3, transition:'width 0.3s ease' }}/>
            </div>
          </div>
        )}

        {/* Message */}
        {quickMsg && (
          <div style={{ padding:'10px 14px', borderRadius:8, fontSize:'0.76rem', fontWeight:600, background: quickOk ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border:`1px solid ${quickOk ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'}`, color: quickOk ? '#16a34a' : '#dc2626' }}>
            {quickMsg}
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ flexShrink:0, padding:'12px 16px', borderTop:'1px solid rgba(0,0,0,0.07)', background:'#fafafa' }}>
        <button onClick={uploadQuickFiles} disabled={quickUploading || quickItems.length === 0}
          style={{ width:'100%', background: quickItems.length > 0 ? '#111' : 'rgba(0,0,0,0.07)', color: quickItems.length > 0 ? '#fff' : 'rgba(0,0,0,0.25)', border:'none', borderRadius:10, padding:'12px', fontSize:'0.78rem', fontFamily:"'DM Sans',sans-serif", fontWeight:900, letterSpacing:'0.08em', textTransform:'uppercase', cursor: quickItems.length > 0 ? 'pointer' : 'default' }}>
          {quickUploading ? `Uploading… ${quickProgress}%` : quickItems.length > 0 ? `Upload ${quickItems.length} File${quickItems.length !== 1 ? 's' : ''}` : 'Select Files First'}
        </button>
      </div>

    </div>
  </div>
)}

        {/* ── MODAL VIEWER ── */}
        {modal && (
          <div className="modal-overlay" onClick={() => { if (!fullscreen) setModal(null); }}>
            <div className={`modal-box${fullscreen ? ' fullscreen' : ''}`} onClick={e => e.stopPropagation()}
              style={{ height: fullscreen ? '100vh' : 'min(80vh, 600px)' }}>
              <div className="modal-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div className="flex items-center gap-2.5" style={{ minWidth: 0, flex: 1 }}>
                  <span className="font-black uppercase" style={{
                    fontSize:'0.55rem', letterSpacing:'0.08em', padding:'2px 8px', borderRadius:20,
                    background: modal.type === 'image' ? 'rgba(110,231,168,0.15)' : modal.type === 'video' ? 'rgba(129,140,248,0.15)' : 'rgba(251,191,36,0.15)',
                    color:      modal.type === 'image' ? '#6ee7a8'               : modal.type === 'video' ? '#818cf8'               : '#fbbf24',
                  }}>{modal.type}</span>
                  {modal.fileName && <span style={{ fontSize:'0.74rem', color:'rgba(0,0,0,0.4)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{modal.fileName}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setFullscreen(f => !f)} className="border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.12)', color:'#111', padding:'6px 10px', fontSize:'0.8rem', fontFamily:"'DM Sans',sans-serif" }}>
                    {fullscreen
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    }
                  </button>
                  <button onClick={() => setModal(null)} className="border-none rounded-lg font-bold cursor-pointer"
                    style={{ background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.12)', color:'#111', padding:'6px 10px', fontSize:'0.85rem', fontFamily:"'DM Sans',sans-serif" }}>✕</button>
                </div>
              </div>
              <div className="modal-media">
                {modal.type === 'image' && <img src={modal.src} alt={modal.caption}/>}
                {modal.type === 'video' && <video src={modal.src} controls autoPlay/>}
                {modal.type === 'document' && (
                  <div className="flex flex-col items-center justify-center gap-4 p-10 text-center flex-1">
                    <div className="flex items-center justify-center font-black" style={{ width:60, height:74, background:'rgba(0,0,0,0.07)', borderRadius:6, color:'#f59e0b', fontSize:'0.8rem', letterSpacing:'0.05em' }}>PDF</div>
                    <div style={{ fontSize:'0.85rem', color:'rgba(0,0,0,0.5)' }}>{modal.fileName}</div>
                    <a href={modal.src} target="_blank" rel="noreferrer"
                      className="border-none rounded-lg font-black uppercase tracking-wider cursor-pointer text-white no-underline"
                      style={{ background:'#111', padding:'10px 22px', fontSize:'0.72rem', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.1em' }}>
                      Open Document
                    </a>
                  </div>
                )}
              </div>
              {modal.caption && <div className="modal-footer">{modal.caption}</div>}
            </div>
          </div>
        )}

      </div>
    </>
  );
}