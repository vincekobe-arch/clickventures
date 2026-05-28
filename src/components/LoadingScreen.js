import React, { useEffect, useState, useRef } from 'react';

const messages = [
  'Drawing your route...',
  'Loading documentary spots...',
  'Preparing your journey...',
  'Almost there...',
];

const PATH = 'M 100 290 C 140 240, 180 200, 230 170 C 275 142, 330 148, 370 120 C 410 93, 450 88, 490 72';

export default function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);
  const routeRef = useRef(null);
  const planeRef = useRef(null);
  const rafRef   = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
      window.location.replace(user?.role === 'admin' ? '/admin' : '/dashboard');
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const routeEl = routeRef.current;
    const planeEl = planeRef.current;
    if (!routeEl || !planeEl) return;

    const DURATION = 2800;
    const PAUSE    = 600;
    const TOTAL    = DURATION + PAUSE;
    const LEN      = routeEl.getTotalLength();

    routeEl.style.strokeDasharray  = LEN;
    routeEl.style.strokeDashoffset = LEN;

    let start = null;

    function tick(ts) {
      if (!start) start = ts;
      const elapsed = (ts - start) % TOTAL;
      const t = Math.min(elapsed / DURATION, 1);

      // route line
      routeEl.style.strokeDashoffset = LEN * (1 - t);

      // plane position + rotation
      const pt  = routeEl.getPointAtLength(t * LEN);
      const pt2 = routeEl.getPointAtLength(Math.max(0, t * LEN - 2));
      const angle = Math.atan2(pt.y - pt2.y, pt.x - pt2.x) * (180 / Math.PI) + 90;
      planeEl.setAttribute('transform', `translate(${pt.x},${pt.y}) rotate(${angle})`);
      planeEl.style.opacity = t < 0.04 ? t / 0.04 : t > 0.92 ? (1 - t) / 0.08 : 1;

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <>
      <style>{`
        @keyframes cv_fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cv_blink  { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes cv_bounce { 0%,80%,100%{transform:scaleY(.45);opacity:.35} 40%{transform:scaleY(1.15);opacity:1} }
        @keyframes cv_pingA  { 0%{r:7;opacity:.9;stroke-width:2} 100%{r:24;opacity:0;stroke-width:.5} }
        @keyframes cv_pingB  { 0%{r:7;opacity:.7;stroke-width:1.5} 100%{r:20;opacity:0;stroke-width:.5} }
      `}</style>

      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', background:'#fff', fontFamily:"'Segoe UI',sans-serif",
        padding:'2.5rem 1rem 2rem',
      }}>

        <svg width="100%" viewBox="0 0 580 340" xmlns="http://www.w3.org/2000/svg"
          style={{ maxWidth:480, display:'block', width:'100%' }}>

          {/* Ghost track */}
          <path d={PATH} fill="none" stroke="#e8e8e8" strokeWidth="2"
            strokeLinecap="round" strokeDasharray="6 7"/>

          {/* Animated route — driven by JS */}
          <path ref={routeRef} d={PATH} fill="none" stroke="#111"
            strokeWidth="2.5" strokeLinecap="round"/>

          {/* START pin */}
          <circle cx="100" cy="290" r="7" fill="#111" stroke="#fff" strokeWidth="2"/>
          <circle cx="100" cy="290" r="7" fill="none" stroke="#111" strokeWidth="1.5"
            style={{ animation:'cv_pingA 2s ease-out infinite' }}/>
          <circle cx="100" cy="290" r="7" fill="none" stroke="#111" strokeWidth="1"
            style={{ animation:'cv_pingA 2s ease-out .6s infinite' }}/>
          <line x1="100" y1="283" x2="100" y2="265" stroke="#111" strokeWidth="1.5"/>
          <circle cx="100" cy="262" r="4" fill="#111"/>
          <rect x="62" y="298" width="76" height="18" rx="4" fill="#111"/>
          <text x="100" y="311" textAnchor="middle" fontSize="9.5" fill="#fff"
            fontFamily="Segoe UI,sans-serif" fontWeight="700" letterSpacing=".08em">Home</text>

          {/* END pin */}
          <circle cx="490" cy="72" r="7" fill="#fff" stroke="#111" strokeWidth="2"/>
          <circle cx="490" cy="72" r="7" fill="none" stroke="#111" strokeWidth="1.5"
            style={{ animation:'cv_pingB 2s ease-out .4s infinite' }}/>
          <line x1="490" y1="65" x2="490" y2="47" stroke="#111" strokeWidth="1.5"/>
          <circle cx="490" cy="44" r="4" fill="#fff" stroke="#111" strokeWidth="1.5"/>
          <rect x="454" y="26" width="72" height="18" rx="4" fill="#111"/>
          <text x="490" y="39" textAnchor="middle" fontSize="9.5" fill="#fff"
            fontFamily="Segoe UI,sans-serif" fontWeight="700" letterSpacing=".08em">Baguio City</text>

          {/* Waypoint dots */}
          <circle cx="230" cy="170" r="3.5" fill="#fff" stroke="#111" strokeWidth="1.5"/>
          <circle cx="370" cy="120" r="3.5" fill="#fff" stroke="#111" strokeWidth="1.5"/>

          {/* Paper plane — driven by JS */}
          <g ref={planeRef} style={{ opacity:0 }}>
            <g transform="translate(-10,-10)">
              <polygon points="10,0 20,18 10,13 0,18"
                fill="#111" stroke="#fff" strokeWidth=".8" strokeLinejoin="round"/>
              <line x1="0"  y1="18" x2="10" y2="13" stroke="#fff" strokeWidth=".6"/>
              <line x1="20" y1="18" x2="10" y2="13" stroke="#fff" strokeWidth=".6"/>
              <line x1="10" y1="0"  x2="10" y2="13" stroke="#fff" strokeWidth=".5" opacity=".6"/>
            </g>
          </g>
        </svg>

        <div style={{ fontSize:'.62rem', fontWeight:800, letterSpacing:'.24em', color:'#aaa',
          textTransform:'uppercase', marginTop:'1.2rem', animation:'cv_fadeUp .6s ease .1s both' }}>
          Baguio City Tourism
        </div>

        <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#111', letterSpacing:'.1em',
          textTransform:'uppercase', marginTop:'.3rem', animation:'cv_fadeUp .6s ease .22s both' }}>
          CLICKVENTURES
        </div>

        <div style={{ display:'flex', gap:5, marginTop:'1rem', animation:'cv_fadeUp .6s ease .34s both' }}>
          {[0,.13,.26,.39,.52].map((d,i) => (
            <div key={i} style={{ width:4, height:18, borderRadius:2, background:'#111',
              animation:`cv_bounce 1.1s ease infinite`, animationDelay:`${d}s` }}/>
          ))}
        </div>

        <div style={{ fontSize:'.74rem', color:'#aaa', marginTop:'.7rem', letterSpacing:'.07em',
          animation:'cv_blink 2.2s ease infinite', minHeight:'1.2em' }}>
          {messages[msgIdx]}
        </div>
      </div>
    </>
  );
}