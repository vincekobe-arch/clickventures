import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const spots = [
  {
    slug: 'ili-likha',
    name: 'Ili-Likha Village',
    desc: 'A living cultural village celebrating the indigenous arts, crafts, and traditions of the Cordilleran people of the Cordillera region.',
    img: '/images/spots/ili-likha.jpg',
  },
  {
    slug: 'lourdes-grotto',
    name: 'Our Lady of Lourdes Grotto',
    desc: 'A sacred hilltop shrine perched above Baguio City, offering breathtaking panoramic views and a place of quiet devotion.',
    img: '/images/spots/lourdes-grotto.jpg',
  },
  {
    slug: 'botanical-garden',
    name: 'Botanical Garden',
    desc: 'A lush sanctuary of native Cordilleran plants, flowers, and a traditional Igorot village showcasing indigenous highland life.',
    img: '/images/spots/botanical-garden.jpg',
  },
  {
    slug: 'igorot-stone-kingdom',
    name: 'Igorot Stone Kingdom',
    desc: 'An awe-inspiring cultural heritage site featuring massive stone carvings that depict the rich history and spirit of the Igorot people.',
    img: '/images/spots/igorot-stone-kingdom.jpg',
  },
  {
    slug: 'camp-john-hay',
    name: 'Camp John Hay',
    desc: 'A historic former American military rest and recreation camp now transformed into a premier leisure and nature destination in Baguio.',
    img: '/images/spots/camp-john-hay.jpg',
  },
];

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

export default function Home() {
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
  const isUser = user && user.role === 'user';
  const isLoggedIn = !!user;
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [visible, setVisible] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSent, setContactSent] = useState(false);
  const intervalRef = useRef(null);
  const stripDragRef = useRef(null);
  const [stripDragOffset, setStripDragOffset] = useState(0);
  const [stripIsDragging, setStripIsDragging] = useState(false);
  const stripDragStartX = useRef(null);
  const stripDragStartY = useRef(null);

  const [aboutRef, aboutInView] = useInView();
  const [spotsRef, spotsInView] = useInView();
  const [contactRef, contactInView] = useInView();

  const goTo = (idx) => {
    const next = ((idx % spots.length) + spots.length) % spots.length;
    setFade(false);
    setTimeout(() => { setCurrent(next); setFade(true); }, 350);
  };

  const startAuto = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % spots.length;
        setFade(false);
        setTimeout(() => setFade(true), 350);
        return next;
      });
    }, 4500);
  };

  useEffect(() => { startAuto(); return () => clearInterval(intervalRef.current); }, []);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const strip = stripDragRef.current;
    if (!strip) return;

    let activeCurrent = current;

    function onTouchStart(e) {
      stripDragStartX.current = e.touches[0].clientX;
      stripDragStartY.current = e.touches[0].clientY;
      activeCurrent = current;
      setStripIsDragging(true);
      setStripDragOffset(0);
      clearInterval(intervalRef.current);
    }
    function onTouchMove(e) {
      if (stripDragStartX.current === null) return;
      const diff = e.touches[0].clientX - stripDragStartX.current;
      const absDiffX = Math.abs(diff);
      const absDiffY = Math.abs(e.touches[0].clientY - (stripDragStartY.current ?? e.touches[0].clientY));
      if (absDiffX > absDiffY) {
        e.preventDefault();
        const steps = Math.round(-diff / 160);
        const newIdx = Math.max(0, Math.min(spots.length - 1, activeCurrent + steps));
        setCurrent(prev => {
          if (prev !== newIdx) { setFade(false); setTimeout(() => setFade(true), 350); }
          return newIdx;
        });
        setStripDragOffset(diff + steps * 160);
      }
    }
    function onTouchEnd(e) {
      if (stripDragStartX.current === null) return;
      setStripIsDragging(false);
      setStripDragOffset(0);
      stripDragStartX.current = null;
      stripDragStartY.current = null;
      startAuto();
    }

    function onMouseDown(e) {
      stripDragStartX.current = e.clientX;
      activeCurrent = current;
      setStripIsDragging(true);
      setStripDragOffset(0);
      clearInterval(intervalRef.current);
    }
    function onMouseMove(e) {
      if (stripDragStartX.current === null) return;
      const diff = e.clientX - stripDragStartX.current;
      const steps = Math.round(-diff / 160);
      const newIdx = Math.max(0, Math.min(spots.length - 1, activeCurrent + steps));
      setCurrent(prev => {
        if (prev !== newIdx) { setFade(false); setTimeout(() => setFade(true), 350); }
        return newIdx;
      });
      setStripDragOffset(diff + steps * 160);
    }
    function onMouseUp(e) {
      if (stripDragStartX.current === null) return;
      setStripIsDragging(false);
      setStripDragOffset(0);
      stripDragStartX.current = null;
      startAuto();
    }

    strip.addEventListener('touchstart', onTouchStart, { passive: true });
    strip.addEventListener('touchmove',  onTouchMove,  { passive: false });
    strip.addEventListener('touchend',   onTouchEnd);
    strip.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onMouseUp);

    return () => {
      strip.removeEventListener('touchstart', onTouchStart);
      strip.removeEventListener('touchmove',  onTouchMove);
      strip.removeEventListener('touchend',   onTouchEnd);
      strip.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, []);

  const handleSpotClick = (slug) => {
    if (!user) navigate('/login', { state: { from: `/spot/${slug}` } });
    else if (user.role === 'user') navigate(`/spot/${slug}`);
    else if (user.role === 'admin') navigate('/admin');
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => setContactSent(false), 4000);
    setContactForm({ name: '', email: '', message: '' });
  };

  const spot = spots[current];

  return (
    <div className="font-sans bg-white min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&family=DM+Serif+Display:ital@0;1&display=swap');

        * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(40px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmerText {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes lineGrow {
          from { width: 0; }
          to   { width: 44px; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -100; }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0,0); }
          10%       { transform: translate(-2%,-3%); }
          30%       { transform: translate(3%,2%); }
          50%       { transform: translate(-1%,4%); }
          70%       { transform: translate(4%,-2%); }
          90%       { transform: translate(-3%,1%); }
        }
        .grain-overlay::after {
          content: '';
          position: absolute;
          inset: -50%;
          width: 200%;
          height: 200%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 128px;
          opacity: 0.035;
          animation: grain 8s steps(10) infinite;
          pointer-events: none;
          z-index: 1;
        }
        .hero-text-gradient {
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.6) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 4s linear infinite;
        }
        .card-lift {
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
        }
        .card-lift:hover {
          transform: translateY(-10px) scale(1.01);
          box-shadow: 0 24px 60px rgba(0,0,0,0.13);
        }
        .spot-img-zoom img {
          transition: transform 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .spot-img-zoom:hover img {
          transform: scale(1.07);
        }
        .contact-input {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          background: #1a1a1a;
          color: #fff;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .contact-input:focus {
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
        }
        .contact-input::placeholder { color: rgba(255,255,255,0.25); }
        .thumbnail-strip {
          mask-image: linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%);
        }
        .section-reveal {
          transition: opacity 0.9s cubic-bezier(0.4,0,0.2,1), transform 0.9s cubic-bezier(0.4,0,0.2,1);
        }
        .about-card {
          position: relative;
          overflow: hidden;
        }
        .about-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
        }
        .stat-divider {
          position: relative;
        }
        .stat-divider:not(:last-child)::after {
          content: '';
          position: absolute;
          right: 0; top: 20%; height: 60%;
          width: 1px;
          background: rgba(255,255,255,0.07);
        }
        .arrow-hover {
          display: inline-block;
          transition: transform 0.2s ease;
        }
        .group:hover .arrow-hover {
          transform: translateX(5px);
        }
        .btn-primary {
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        }
        .btn-outline {
          transition: all 0.25s ease;
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.7);
          transform: translateY(-2px);
        }

        @media (max-width: 640px) {
          .hero-cta-wrap { flex-direction: column; align-items: stretch; }
          .hero-cta-wrap button { width: 100%; justify-content: center; }
          .about-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .stat-divider:not(:last-child)::after { display: none; }
          .spots-row-3 { grid-template-columns: 1fr !important; }
          .spots-row-2 { grid-template-columns: 1fr !important; width: 100% !important; }
          .contact-grid-3 { grid-template-columns: 1fr !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
          .about-section { padding: 72px 20px !important; }
          .spots-section { padding: 64px 20px !important; }
          .contact-section { padding: 72px 20px !important; }
          .contact-form-wrap { padding: 28px 20px !important; }
          .hero-cta-wrap { max-width: 300px !important; }
          .hero-cta-btn { display: none !important; }
          .thumbnail-strip-inner { /* centering handled via JS */ }
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="relative h-screen overflow-hidden grain-overlay" style={{ minHeight: '640px' }}>

        {/* BG images crossfade */}
        {spots.map((sp, i) => (
          <div key={sp.slug} className="absolute inset-0 bg-cover bg-center transition-opacity duration-700" style={{
            backgroundImage: `url(${sp.img})`,
            opacity: i === current ? 1 : 0,
            zIndex: 0,
          }} />
        ))}

        {/* Gradient overlay */}
        <div className="absolute inset-0 z-10" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.92) 100%)',
        }} />

        {/* Hero content */}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center text-white px-6" style={{ paddingBottom: 'clamp(200px, 35vw, 240px)' }}>

          

          {/* Title */}
          <h1
            className="hero-text-gradient font-black uppercase tracking-widest mb-3"
            style={{
              fontSize: 'clamp(2.2rem, 6.5vw, 4.5rem)',
              textShadow: '0 2px 32px rgba(0,0,0,0.4)',
              fontFamily: "'DM Sans', sans-serif",
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-20px)',
              transition: 'opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s',
            }}
          >
            CLICKVENTURES
          </h1>

          <p
            className="text-white/65 tracking-widest mb-10 uppercase"
            style={{
              fontSize: 'clamp(0.72rem, 1.6vw, 0.9rem)',
              letterSpacing: '0.16em',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
            }}
          >
            Discover the Documentary Spots of Baguio City
          </p>

          {/* Active spot info */}
          <div
            className="max-w-xl mb-9"
            style={{
              opacity: fade ? 1 : 0,
              transform: fade ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            <h2 className="font-bold text-white mb-3" style={{ fontSize: 'clamp(1.15rem, 2.6vw, 1.85rem)', textShadow: '0 1px 16px rgba(0,0,0,0.5)' }}>
              {spot.name}
            </h2>
            <p className="text-white/65 leading-relaxed text-sm">{spot.desc}</p>
          </div>

          {/* CTA */}
          <div
            className="hero-cta-wrap flex gap-3 justify-center"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 1s ease 0.35s, transform 1s ease 0.35s',
              flexWrap: 'wrap',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <button
              onClick={() => handleSpotClick(spot.slug)}
              className="btn-primary bg-white text-gray-900 font-bold tracking-wider uppercase rounded hero-cta-btn"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)', letterSpacing: '0.08em', padding: '11px 24px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              {isLoggedIn ? (user.role === 'admin' ? 'GO TO DASHBOARD' : 'EXPLORE NOW') : 'LOGIN TO EXPLORE'}
            </button>

            <button
              onClick={() => document.getElementById('spots')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-outline font-bold tracking-wider uppercase rounded text-white border hero-cta-btn"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(6px)', letterSpacing: '0.08em', padding: '11px 24px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
            >
              VIEW SPOTS ↓
            </button>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="absolute z-30 flex gap-2" style={{ bottom: 'clamp(185px, 30vw, 258px)', left: '50%', transform: 'translateX(-50%)' }}>
          {spots.map((_, i) => (
            <button key={i}
              onClick={() => { clearInterval(intervalRef.current); goTo(i); startAuto(); }}
              className="rounded-full border-none cursor-pointer p-0 transition-all duration-300"
              style={{
                width: i === current ? '24px' : '7px', height: '7px',
                background: i === current ? '#fff' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* Thumbnail strip */}
        <div ref={stripDragRef} className="absolute bottom-0 z-30 overflow-hidden thumbnail-strip" style={{ left: 0, right: 0, width: '100%', cursor: 'grab', userSelect: 'none' }}>
          <div
            className="thumbnail-strip-inner flex items-end gap-3"
            style={{
              transform: `translateX(calc(50vw - 130px + ${-current * 197}px + ${stripDragOffset}px))`,
              transition: stripIsDragging ? 'none' : 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: 'transform',
            }}
          >
            {spots.map((sp, spotIdx) => {
              const isActive = spotIdx === current;
              return (
                <div key={sp.slug}
                  onClick={() => { clearInterval(intervalRef.current); goTo(spotIdx); startAuto(); }}
                  className="flex-shrink-0 relative cursor-pointer overflow-hidden"
                  style={{
                    width: isActive ? '260px' : '185px',
                    height: isActive ? '210px' : '155px',
                    borderRadius: '10px 10px 0 0',
                    borderTop: isActive ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.22)',
                    borderLeft: isActive ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.22)',
                    borderRight: isActive ? '2px solid rgba(255,255,255,0.9)' : '2px solid rgba(255,255,255,0.22)',
                    borderBottom: 'none',
                    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1), height 0.6s cubic-bezier(0.4,0,0.2,1), border-color 0.4s',
                    boxShadow: isActive ? '0 -12px 40px rgba(0,0,0,0.5)' : '0 -4px 14px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={{
                    backgroundImage: `url(${sp.img})`,
                    filter: isActive ? 'none' : 'brightness(0.45)',
                    transition: 'filter 0.5s ease',
                  }} />
                  <div className="absolute inset-0" style={{
                    background: isActive
                      ? 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.04) 55%)'
                      : 'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0.02) 65%)',
                  }} />
                  {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-white" />}
                  <div className="absolute bottom-0 left-0 right-0 text-white" style={{ padding: isActive ? '12px 14px 14px' : '8px 10px 10px' }}>
                    <div style={{ fontSize: isActive ? '0.88rem' : '0.72rem', fontWeight: 700, lineHeight: 1.3, textShadow: '0 1px 6px rgba(0,0,0,0.7)', opacity: isActive ? 1 : 0.72 }}>
                      {sp.name}
                    </div>
                    {isActive && <div className="text-white/55 mt-1" style={{ fontSize: '0.62rem', letterSpacing: '0.1em' }}>TAP TO EXPLORE</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        
        
      </div>

      {/* ── ABOUT SECTION ── */}
      <div id="about" ref={aboutRef}
        className="section-reveal relative about-section"
        style={{
          background: '#080808',
          color: '#fff',
          padding: '110px 24px',
          opacity: aboutInView ? 1 : 0,
          transform: aboutInView ? 'translateY(0)' : 'translateY(48px)',
        }}
      >
        {/* Decorative SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04, zIndex: 0 }} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <circle cx="1100" cy="100" r="300" fill="none" stroke="white" strokeWidth="1"/>
          <circle cx="100" cy="500" r="250" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="500" y="200" width="200" height="200" fill="none" stroke="white" strokeWidth="1" style={{ animation: 'spinSlow 25s linear infinite', transformOrigin: '600px 300px' }}/>
        </svg>

        <div className="max-w-5xl mx-auto relative z-10">
          <p className="text-center text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '0.28em' }}>
            BSTM-612 — Baguio City Tourism Documentation
          </p>

          <h2
            className="text-center font-black uppercase mb-4"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.01em',
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.45) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            CLICKVENTURES
          </h2>

          <div className="mx-auto mb-16 rounded-full" style={{
            width: aboutInView ? '44px' : '0',
            height: '2px',
            background: 'rgba(255,255,255,0.35)',
            transition: 'width 0.7s ease 0.3s',
          }} />

          <div className="about-grid grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            {[
              {
                tag: 'VISION', icon: '◈', heading: 'Where We Aim to Be',
                body: 'To become a leading travel and photography brand that captures meaningful moments and turns them into unforgettable stories worth sharing around the world.',
              },
              {
                tag: 'MISSION', icon: '◉', heading: 'How We Get There',
                body: 'To provide high-quality travel and photography services that document real experiences, connect people through visual storytelling, and inspire others to explore and appreciate every journey.',
              },
            ].map((item, i) => (
              <div
                key={item.tag}
                className="about-card p-11"
                style={{
                  background: '#111',
                  borderRadius: '2px',
                  opacity: aboutInView ? 1 : 0,
                  transform: aboutInView ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.7s ease ${0.2 + i * 0.15}s, transform 0.7s ease ${0.2 + i * 0.15}s`,
                }}
              >
                <div className="flex items-center gap-3 mb-5" style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>
                  <span style={{ fontSize: '1rem', opacity: 0.45 }}>{item.icon}</span>
                  {item.tag}
                </div>
                <h3 className="font-bold text-white mb-4" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', lineHeight: 1.3 }}>{item.heading}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.9 }}>{item.body}</p>
              </div>
            ))}
          </div>

          {/* Stats bar */}
          <div className="stats-grid grid gap-6 p-10" style={{
            background: '#111',
            borderRadius: '2px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          }}>
            {[
              { value: '5', label: 'Tourist Spots Documented' },
              { value: 'Baguio', label: 'City of Pines, Philippines' },
              { value: 'BSTM-612', label: 'Tourism Documentation Course' },
              { value: '2026', label: 'Academic Year' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="stat-divider text-center"
                style={{
                  opacity: aboutInView ? 1 : 0,
                  transform: aboutInView ? 'translateY(0)' : 'translateY(16px)',
                  transition: `opacity 0.6s ease ${0.4 + i * 0.1}s, transform 0.6s ease ${0.4 + i * 0.1}s`,
                }}
              >
                <div className="font-black text-white mb-1.5" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', letterSpacing: '-0.01em' }}>{stat.value}</div>
                <div className="uppercase" style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', lineHeight: 1.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SPOTS GRID ── */}
      <div id="spots" ref={spotsRef}
        className="max-w-5xl mx-auto px-6 section-reveal spots-section"
        style={{
          padding: '90px 24px',
          opacity: spotsInView ? 1 : 0,
          transform: spotsInView ? 'translateY(0)' : 'translateY(48px)',
        }}
      >
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: '#999', letterSpacing: '0.22em' }}>Baguio City</p>
          <h2 className="font-black text-gray-900 mb-4" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)' }}>Tourist Spots</h2>
          <div className="mx-auto mb-4" style={{
            width: spotsInView ? '44px' : '0',
            height: '3px',
            background: '#111',
            transition: 'width 0.7s ease 0.2s',
            borderRadius: '2px',
          }} />
          <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            {isLoggedIn ? 'Click any spot to view its documentary files.' : 'Login to access the documentary files for each tourist spot.'}
          </p>
        </div>

        <div className="flex flex-col gap-7">
          <div className="spots-row-3 grid grid-cols-3 gap-7">
            {spots.slice(0, 3).map((sp, i) => (
              <div
                key={sp.slug}
                className="card-lift group rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
                onClick={() => handleSpotClick(sp.slug)}
                onMouseEnter={() => setHoveredCard(sp.slug)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  opacity: spotsInView ? 1 : 0,
                  transform: spotsInView ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
                }}
              >
                <div className="spot-img-zoom relative overflow-hidden" style={{ height: '190px' }}>
                  <img src={sp.img} alt={sp.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 transition-colors duration-300" style={{ background: hoveredCard === sp.slug ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.02)' }} />
                  {!isUser && (
                    <div className="absolute top-3 right-3 text-white font-bold rounded-full px-3 py-1" style={{ background: 'rgba(0,0,0,0.65)', fontSize: '0.58rem', letterSpacing: '0.08em' }}>
                      LOGIN REQUIRED
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 text-white/70 font-black rounded px-2 py-1" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', fontSize: '0.56rem', letterSpacing: '0.12em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="p-5 pb-6">
                  <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '0.98rem' }}>{sp.name}</h3>
                  <p className="text-gray-500 leading-relaxed mb-4" style={{ fontSize: '0.84rem' }}>{sp.desc}</p>
                  <div className="flex items-center gap-2 font-bold text-gray-900" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                    {isUser ? 'VIEW DOCUMENTARIES' : 'LOGIN TO VIEW'}
                    <span className="arrow-hover">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="spots-row-2 grid grid-cols-2 gap-7 mx-auto" style={{ width: 'calc(66.66% + 9.33px)' }}>
            {spots.slice(3).map((sp, i) => (
              <div
                key={sp.slug}
                className="card-lift group rounded-xl overflow-hidden border border-gray-100 cursor-pointer"
                onClick={() => handleSpotClick(sp.slug)}
                onMouseEnter={() => setHoveredCard(sp.slug)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  opacity: spotsInView ? 1 : 0,
                  transform: spotsInView ? 'translateY(0)' : 'translateY(28px)',
                  transition: `opacity 0.6s ease ${0.4 + i * 0.1}s, transform 0.6s ease ${0.4 + i * 0.1}s`,
                }}
              >
                <div className="spot-img-zoom relative overflow-hidden" style={{ height: '190px' }}>
                  <img src={sp.img} alt={sp.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 transition-colors duration-300" style={{ background: hoveredCard === sp.slug ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.02)' }} />
                  {!isUser && (
                    <div className="absolute top-3 right-3 text-white font-bold rounded-full px-3 py-1" style={{ background: 'rgba(0,0,0,0.65)', fontSize: '0.58rem', letterSpacing: '0.08em' }}>
                      LOGIN REQUIRED
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 text-white/70 font-black rounded px-2 py-1" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', fontSize: '0.56rem', letterSpacing: '0.12em' }}>
                    {String(i + 4).padStart(2, '0')}
                  </div>
                </div>
                <div className="p-5 pb-6">
                  <h3 className="font-bold text-gray-900 mb-2" style={{ fontSize: '0.98rem' }}>{sp.name}</h3>
                  <p className="text-gray-500 leading-relaxed mb-4" style={{ fontSize: '0.84rem' }}>{sp.desc}</p>
                  <div className="flex items-center gap-2 font-bold text-gray-900" style={{ fontSize: '0.72rem', letterSpacing: '0.05em' }}>
                    {isUser ? 'VIEW DOCUMENTARIES' : 'LOGIN TO VIEW'}
                    <span className="arrow-hover">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTACT SECTION ── */}
      <div id="contact" ref={contactRef}
        className="section-reveal relative overflow-hidden contact-section"
        style={{
          background: '#080808',
          color: '#fff',
          padding: '110px 24px',
          opacity: contactInView ? 1 : 0,
          transform: contactInView ? 'translateY(0)' : 'translateY(48px)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute pointer-events-none" style={{ top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)' }} />

        <div className="max-w-2xl mx-auto relative z-10">
          <p className="text-center font-bold uppercase mb-3" style={{ fontSize: '0.65rem', letterSpacing: '0.28em', color: 'rgba(255,255,255,0.28)' }}>GET IN TOUCH</p>

          <h2
            className="text-center font-black mb-4"
            style={{
              fontSize: 'clamp(1.9rem, 4.5vw, 3rem)',
              lineHeight: 1.15,
              background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.5) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Contact Us
          </h2>

          <div className="mx-auto mb-5 rounded-full" style={{
            width: contactInView ? '44px' : '0',
            height: '2px',
            background: 'rgba(255,255,255,0.28)',
            transition: 'width 0.7s ease 0.2s',
          }} />

          <p className="text-center text-sm leading-relaxed mb-12" style={{ color: 'rgba(255,255,255,0.42)' }}>
            Have questions about Clickventures or the documentary spots? We'd love to hear from you.
          </p>

          {/* Info cards */}
          <div className="contact-grid-3 grid grid-cols-3 gap-4 mb-10">
            {[
              { icon: '📍', label: 'Location', value: 'Baguio City, Philippines' },
              { icon: '📧', label: 'Email', value: 'clickventures@bstm.edu' },
              { icon: '📚', label: 'Course', value: 'BSTM-612' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="text-center rounded-xl p-5 border"
                style={{
                  background: '#111',
                  borderColor: 'rgba(255,255,255,0.06)',
                  opacity: contactInView ? 1 : 0,
                  transform: contactInView ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.6s ease ${0.1 + i * 0.1}s, transform 0.6s ease ${0.1 + i * 0.1}s`,
                }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-bold uppercase mb-1" style={{ fontSize: '0.58rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.25)' }}>{item.label}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div
            className="contact-form-wrap rounded-2xl p-10 border"
            style={{
              background: '#111',
              borderColor: 'rgba(255,255,255,0.06)',
              opacity: contactInView ? 1 : 0,
              transform: contactInView ? 'translateY(0)' : 'translateY(28px)',
              transition: 'opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s',
            }}
          >
            {contactSent ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✓</div>
                <div className="font-bold text-green-400 text-base mb-2">Message Sent!</div>
                <div className="text-sm" style={{ color: 'rgba(255,255,255,0.38)' }}>We'll get back to you soon.</div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                <div className="contact-form-grid grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.32)' }}>Name</label>
                    <input className="contact-input" type="text" placeholder="Your name" value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block font-bold uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.32)' }}>Email</label>
                    <input className="contact-input" type="email" placeholder="your@email.com" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} required />
                  </div>
                </div>
                <div>
                  <label className="block font-bold uppercase mb-2" style={{ fontSize: '0.6rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.32)' }}>Message</label>
                  <textarea className="contact-input" placeholder="Write your message here…" value={contactForm.message} onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))} required rows={5} style={{ resize: 'vertical', lineHeight: 1.7 }} />
                </div>
                <button
                  type="submit"
                  className="self-start font-black uppercase tracking-wider px-8 py-3.5 rounded-lg transition-all duration-200"
                  style={{
                    background: '#fff', color: '#111',
                    fontSize: '0.74rem', letterSpacing: '0.1em',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.1)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e8e8e8'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(255,255,255,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.1)'; }}
                >
                  Send Message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-gray-100 text-center py-7 text-gray-400 tracking-wider" style={{ fontSize: '0.75rem' }}>
        © {new Date().getFullYear()} CLICKVENTURES — Baguio City Tourism
      </div>
    </div>
  );
}