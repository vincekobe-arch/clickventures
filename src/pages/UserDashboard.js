import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const spots = [
  { slug: 'ili-likha', name: 'Ili-Likha Village', desc: 'A living cultural village celebrating the indigenous arts, crafts, and traditions of the Cordilleran people.', img: '/images/spots/ili-likha.jpg' },
  { slug: 'lourdes-grotto', name: 'Our Lady of Lourdes Grotto', desc: 'A sacred hilltop shrine perched above Baguio City, offering breathtaking panoramic views.', img: '/images/spots/lourdes-grotto.jpg' },
  { slug: 'botanical-garden', name: 'Botanical Garden', desc: 'A lush sanctuary of native Cordilleran plants, flowers, and a traditional Igorot village.', img: '/images/spots/botanical-garden.jpg' },
  { slug: 'igorot-stone-kingdom', name: 'Igorot Stone Kingdom', desc: 'An awe-inspiring cultural heritage site featuring massive stone carvings of the Igorot people.', img: '/images/spots/igorot-stone-kingdom.jpg' },
  { slug: 'camp-john-hay', name: 'Camp John Hay', desc: 'A historic former American military camp now transformed into a premier leisure destination.', img: '/images/spots/camp-john-hay.jpg' },
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,300&display=swap');
  * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes pulse { 0%,100%{opacity:.1} 50%{opacity:.25} }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes spinSlow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes spinReverse { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
  @keyframes dash { to { stroke-dashoffset: -100; } }
  @keyframes flipIn {
    0% { opacity:0; transform: perspective(900px) rotateY(-90deg) scale(0.85); }
    60% { transform: perspective(900px) rotateY(8deg) scale(1.02); }
    100% { opacity:1; transform: perspective(900px) rotateY(0deg) scale(1); }
  }
  @keyframes flipOut {
    0% { opacity:1; transform: perspective(900px) rotateY(0deg) scale(1); }
    40% { transform: perspective(900px) rotateY(-8deg) scale(1.02); }
    100% { opacity:0; transform: perspective(900px) rotateY(90deg) scale(0.85); }
  }
  @keyframes slideUp {
    0% { opacity:0; transform: translateY(60px) scale(0.97); }
    60% { transform: translateY(-6px) scale(1.01); }
    100% { opacity:1; transform: translateY(0) scale(1); }
  }
  @keyframes slideDown {
    0% { opacity:1; transform: translateY(0) scale(1); }
    100% { opacity:0; transform: translateY(60px) scale(0.97); }
  }
  @keyframes overlayFadeIn { from{opacity:0} to{opacity:1} }
  @keyframes overlayFadeOut { from{opacity:1} to{opacity:0} }

  .ud-spot-row {
    display: flex; align-items: center;
    background: #fff;
    border: 1px solid rgba(0,0,0,0.08);
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
    opacity: 0;
  }
  .ud-spot-row:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.15); }
  .ud-spot-row:hover .ud-arrow { transform: translateX(5px); opacity: 1; }
  .ud-spot-row:hover .ud-img-wrap img { transform: scale(1.06); }
  .ud-spot-row:hover .ud-overlay { background: rgba(0,0,0,0.22) !important; }
  .ud-arrow { transition: transform 0.22s ease, opacity 0.22s ease; opacity: 0.3; }
  .ud-img-wrap img { transition: transform 0.35s ease; }

  .ud-view-doc-btn {
    display: inline-flex; align-items: center; gap: 4px;
    background: none; border: none;
    color: rgba(0,0,0,0.35);
    font-size: 0.68rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; white-space: nowrap;
    text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(0,0,0,0.15);
    transition: color 0.2s, text-decoration-color 0.2s;
  }
  .ud-view-doc-btn:hover { color: #111; text-decoration-color: #111; }

  .ud-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 999;
    display: flex; align-items: center; justify-content: center; padding: 24px;
    cursor: zoom-out; backdrop-filter: blur(8px);
    animation: overlayFadeIn 0.25s ease forwards;
  }
  .ud-modal-overlay.closing { animation: overlayFadeOut 0.5s ease forwards; }
  .ud-modal-box {
    background: #fff; border-radius: 18px; overflow: hidden;
    width: 100%; max-width: 560px; cursor: default;
    animation: flipIn 1.2s cubic-bezier(0.25,1.1,0.5,1) forwards;
    box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    max-height: 90vh; overflow-y: auto;
  }
  .ud-modal-box.closing { animation: flipOut 0.55s cubic-bezier(0.25,1.1,0.5,1) forwards; }

  @media (max-width: 640px) {
    .ud-modal-overlay { align-items: flex-end; padding: 0; }
    .ud-modal-box {
      border-radius: 20px 20px 0 0; max-width: 100%; max-height: 85vh;
      animation: slideUp 0.5s cubic-bezier(0.25,1.1,0.5,1) forwards;
    }
    .ud-modal-box.closing { animation: slideDown 0.4s ease forwards; }
  }

  .ud-modal-close {
    background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.3);
    color: #fff; width: 34px; height: 34px; border-radius: 50%;
    font-size: 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .ud-modal-close:hover { background: rgba(255,255,255,0.28); }

  .ud-modal-view-btn {
    background: transparent; border: 1.5px solid rgba(255,255,255,0.45);
    color: rgba(255,255,255,0.85); padding: 6px 16px; border-radius: 6px;
    font-size: 0.64rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
    cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s;
  }
  .ud-modal-view-btn:hover { border-color: #fff; color: #fff; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }

  @media (max-width: 640px) {
    .ud-spot-row { flex-wrap: wrap; }
    .ud-img-wrap { width: 100% !important; height: 160px !important; }
    .ud-spot-row > div:nth-child(2) { display: none; }
    .ud-spot-row .ud-content-wrap { padding: 12px 14px 4px !important; }
    .ud-spot-row > div:last-child { width: 100%; padding: 4px 14px 14px !important; }
    .ud-header-inner { padding-left: 20px !important; padding-right: 20px !important; }
    .ud-list-wrap { padding-left: 20px !important; padding-right: 20px !important; }
    .ud-stats-row { gap: 20px !important; }
    .ud-location-tag { display: none !important; }
  }
`;
function SpotStars({ slug }) {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    fetch(`https://clickventures-api.onrender.com/ratings.php?slug=${slug}&user_id=0`)
      .then(r => r.json()).then(d => setData(d.summary || null)).catch(() => {});
  }, [slug]);

  if (!data || !parseFloat(data.average)) return null;
  const avg = parseFloat(data.average);
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;

  return (
    <div className="flex items-center gap-1 mt-1">
      {[1,2,3,4,5].map(s => (
        <svg key={s} width="11" height="11" viewBox="0 0 24 24"
          fill={s <= full ? '#f59e0b' : (s === full + 1 && half) ? 'url(#half)' : 'none'}
          stroke={s <= full || (s === full + 1 && half) ? '#f59e0b' : 'rgba(0,0,0,0.18)'}
          strokeWidth="1.8">
          {s === full + 1 && half && (
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#f59e0b"/>
                <stop offset="50%" stopColor="transparent"/>
              </linearGradient>
            </defs>
          )}
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span style={{ fontSize: '0.62rem', color: 'rgba(0,0,0,0.35)', fontWeight: 700, marginLeft: 2 }}>
        {avg.toFixed(1)}
      </span>
    </div>
  );
}

export default function UserDashboard() {
  const user = JSON.parse(localStorage.getItem('cv_user') || 'null');
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [modalClosing, setModalClosing] = useState(false);

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => { setModal(null); setModalClosing(false); }, 600);
  };

  if (!user || user.role !== 'user') {
    navigate('/login'); return null;
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f3' }}>
      <style>{css}</style>

      {/* ── ANIMATED BACKGROUND ── */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, opacity: 0.7 }} viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice">
        <circle cx="1100" cy="100" r="220" fill="none" stroke="rgba(0,0,0,.05)" strokeWidth="1"/>
        <circle cx="1100" cy="100" r="140" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
        <circle cx="100"  cy="800" r="260" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1"/>
        <circle cx="600"  cy="450" r="350" fill="none" stroke="rgba(0,0,0,.025)" strokeWidth="1"/>
        <line x1="0" y1="450" x2="1200" y2="450" stroke="rgba(0,0,0,.03)" strokeWidth="1"/>
        <line x1="600" y1="0" x2="600" y2="900" stroke="rgba(0,0,0,.03)" strokeWidth="1"/>
        <line x1="0" y1="0" x2="1200" y2="900" stroke="rgba(0,0,0,.02)" strokeWidth="1"/>
        <path d="M 1100 100 Q 600 300 100 800" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1" strokeDasharray="6 8" style={{ animation: 'dash 12s linear infinite' }}/>
        <rect x="1010" y="30" width="80" height="80" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="1" style={{ animation: 'spinSlow 20s linear infinite', transformOrigin: '1050px 70px' }}/>
        <rect x="1020" y="40" width="60" height="60" fill="none" stroke="rgba(0,0,0,.04)" strokeWidth="1" style={{ animation: 'spinReverse 20s linear infinite', transformOrigin: '1050px 70px' }}/>
        <circle cx="120" cy="140" r="4" fill="rgba(0,0,0,.15)" style={{ animation: 'pulse 3s ease infinite, floatY 6s ease infinite' }}/>
        <circle cx="1080" cy="520" r="3" fill="rgba(0,0,0,.1)" style={{ animation: 'pulse 4s ease 0.8s infinite, floatY 7s ease 1s infinite' }}/>
        <circle cx="580"  cy="820" r="5" fill="rgba(0,0,0,.08)" style={{ animation: 'pulse 3.5s ease 0.4s infinite, floatY 5s ease 0.5s infinite' }}/>
        <path d="M 8 8 L 28 8 L 28 28" fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="1.5"/>
        <path d="M 1192 8 L 1172 8 L 1172 28" fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="1.5"/>
        <path d="M 8 892 L 28 892 L 28 872" fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="1.5"/>
        <path d="M 1192 892 L 1172 892 L 1172 872" fill="none" stroke="rgba(0,0,0,.1)" strokeWidth="1.5"/>
      </svg>

      {/* ── HEADER ── */}
      <div className="relative z-10 border-b" style={{ background: 'rgba(17,17,17,0.97)', borderColor: 'rgba(255,255,255,0.07)', padding: '48px 0 44px' }}>
        <div className="ud-header-inner mx-auto px-10" style={{ maxWidth: '1200px' }}>

          {/* Brand */}
          <div className="flex items-center gap-3 mb-9" style={{ animation: 'fadeUp 0.6s ease 0s forwards', opacity: 0 }}>
            <span className="font-black uppercase tracking-widest" style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)' }}>
              Dashboard
            </span>
          </div>

          <div className="flex items-end justify-between flex-wrap gap-6" style={{ animation: 'fadeUp 0.6s ease 0.1s forwards', opacity: 0 }}>
            <div>
              <p className="font-bold uppercase tracking-widest mb-2" style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)' }}>
                Welcome back
              </p>
              <h1 className="text-white m-0" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {user.first_name || ''}
              </h1>
              <p className="mt-2.5 mb-0" style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.38)', maxWidth: '420px', lineHeight: 1.8 }}>
                Browse and explore documentary files from each Baguio tourist spot.
              </p>
            </div>

            <div className="ud-stats-row flex gap-7" style={{ animation: 'fadeUp 0.6s ease 0.18s forwards', opacity: 0 }}>
              {[
                { label: 'Tourist Spots', val: spots.length },
                { label: 'City',          val: 'Baguio'    },
              ].map(({ label, val }) => (
                <div key={label} className="text-center">
                  <div className="text-white" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2rem', fontWeight: 400, lineHeight: 1 }}>{val}</div>
                  <div className="uppercase tracking-wider mt-1" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SPOTS LIST ── */}
      <div className="ud-list-wrap relative z-10 mx-auto px-10" style={{ maxWidth: '1200px', paddingTop: '36px', paddingBottom: '80px' }}>

        <div className="mb-6" style={{ animation: 'fadeUp 0.6s ease 0.26s forwards', opacity: 0 }}>
          <p className="font-bold uppercase tracking-widest mb-1.5" style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'rgba(0,0,0,0.3)' }}>
            Documentary Spots
          </p>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem', fontWeight: 400, color: '#111', letterSpacing: '-0.01em' }}>
            Select a spot to explore
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {spots.map((sp, i) => (
            <div
              key={sp.slug}
              className="ud-spot-row"
              onClick={() => setModal(sp)}
              style={{ animation: `fadeUp 0.55s ease ${0.32 + i * 0.07}s forwards` }}
            >
              {/* Thumbnail */}
              <div className="ud-img-wrap relative flex-shrink-0 overflow-hidden" style={{ width: '140px', height: '100px' }}>
                <img src={sp.img} alt={sp.name} className="w-full h-full object-cover block" />
                <div className="ud-overlay absolute inset-0 transition-all duration-200" style={{ background: 'rgba(0,0,0,0.08)' }} />
              </div>

              {/* Index number */}
              <div className="flex-shrink-0 text-center" style={{ width: '48px' }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.1rem', color: 'rgba(0,0,0,0.15)', fontWeight: 400 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              {/* Name + desc */}
              <div className="ud-content-wrap flex-1 min-w-0 px-2">
                <div className="font-bold truncate" style={{ fontSize: '0.92rem', color: '#111' }}>
                  {sp.name}
                </div>
                <div className="truncate mt-0.5" style={{ fontSize: '0.74rem', color: 'rgba(0,0,0,0.38)' }}>
                  {sp.desc}
                </div>
                <SpotStars slug={sp.slug} />
              </div>

              {/* Location tag */}
              <div className="ud-location-tag flex-shrink-0 flex items-center gap-1.5 px-5">
                <span className="font-bold uppercase tracking-wider" style={{ fontSize: '0.62rem', color: 'rgba(0,0,0,0.25)', letterSpacing: '0.1em' }}>
                  Baguio City
                </span>
              </div>

              {/* CTA */}
              <div
                className="flex-shrink-0 pr-6"
                onClick={e => { e.stopPropagation(); navigate(`/spot/${sp.slug}`); }}
              >
                <span className="ud-view-doc-btn">
                  View Documentary <span className="ml-1">→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SPOT MODAL ── */}
      {modal && (
        <div className={`ud-modal-overlay${modalClosing ? ' closing' : ''}`} onClick={closeModal}>
          <div className={`ud-modal-box${modalClosing ? ' closing' : ''}`} onClick={e => e.stopPropagation()}>

            {/* Modal header image */}
            <div className="relative overflow-hidden" style={{ height: '220px' }}>
              <img src={modal.img} alt={modal.name} className="w-full h-full object-cover block" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)' }} />

              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-end gap-2.5 p-4">
                <button className="ud-modal-view-btn" onClick={() => navigate(`/spot/${modal.slug}`)}>
                  View Documentary →
                </button>
                <button className="ud-modal-close" onClick={closeModal}>✕</button>
              </div>

              {/* Name over image */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="font-bold uppercase tracking-widest mb-1" style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)' }}>
                  Baguio City · Tourist Spot
                </p>
                <h2 className="m-0" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.55rem', fontWeight: 400, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.15 }}>
                  {modal.name}
                </h2>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 pt-5 pb-6">
              <p className="mb-2" style={{ fontSize: '0.88rem', color: 'rgba(0,0,0,0.6)', lineHeight: 1.8 }}>
                {modal.desc}
              </p>

              {modal.slug === 'ili-likha' && <>
                <p className="mb-3" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Nestled in the heart of Baguio, Ili-Likha Village is a vibrant and living tribute to the rich indigenous heritage of the Cordillera region. The village was conceived as a sanctuary for traditional arts, where master craftsmen and women practice skills passed down through countless generations. Visitors are welcomed into an immersive cultural environment filled with the sights, sounds, and textures of authentic Cordilleran life.
                </p>
                <p className="mb-5" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Within its grounds, artisans demonstrate traditional weaving on backstrap looms, intricate wood carving, and hand-thrown pottery each piece telling a story of identity and ancestral pride. The village also hosts cultural performances, indigenous music, and local cuisine, making it one of the most meaningful and educational stops in Baguio City for those seeking a deeper connection with the highlands.
                </p>
              </>}
              {modal.slug === 'lourdes-grotto' && <>
                <p className="mb-3" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Built in 1907 by the Congregation of the Missionary Sisters of the Immaculate Conception, the Our Lady of Lourdes Grotto stands as one of Baguio's most beloved and enduring religious landmarks. Perched atop a hill accessible by 252 stone steps, the shrine draws thousands of pilgrims and tourists every year who make the climb as an act of devotion and reflection.
                </p>
                <p className="mb-5" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  At the summit, visitors are rewarded with a breathtaking panoramic view of Baguio City stretching across the pine-covered mountains. The grotto itself is a peaceful sanctuary adorned with candles, offerings, and the quiet prayers of the faithful. Whether you come for spiritual renewal or simply to soak in the view, the Lourdes Grotto offers a moment of stillness that lingers long after you descend.
                </p>
              </>}
              {modal.slug === 'botanical-garden' && <>
                <p className="mb-3" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Established in 1966, the Baguio Botanical Garden is a serene and verdant escape located at the heart of the city. Spanning several hectares, the garden is home to a carefully curated collection of native Cordilleran plants, flowering species, and towering pine trees that create a cool and refreshing canopy for those who wander its winding paths.
                </p>
                <p className="mb-5" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Beyond its flora, the garden features a traditional Igorot village where visitors can observe indigenous architecture, tribal costumes, and cultural artifacts up close. Local guides share stories of mountain life and ancestral customs, offering a meaningful cultural dimension to what might otherwise seem like a simple park. It remains one of the most visited and cherished green spaces in all of Baguio.
                </p>
              </>}
              {modal.slug === 'igorot-stone-kingdom' && <>
                <p className="mb-3" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  The Igorot Stone Kingdom is a remarkable and awe-inspiring cultural landmark that rises dramatically from the Cordilleran landscape to honor the proud and storied heritage of the Igorot people. Massive stone sculptures of warriors, chieftains, deities, and mythological figures line the pathways, each one carved with extraordinary detail and cultural intention.
                </p>
                <p className="mb-5" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  The site serves not only as a tourist attraction but as a deeply symbolic monument to a civilization that has withstood centuries of change while preserving its core identity. Walking through the stone kingdom feels like stepping into a living mythology one where every carving whispers of battles fought, harvests celebrated, and ancestors revered. It is a must-visit for anyone seeking to understand the soul of the Cordillera.
                </p>
              </>}
              {modal.slug === 'camp-john-hay' && <>
                <p className="mb-3" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Originally established in 1903 as a rest and recreation facility for American military officers stationed in the Philippines, Camp John Hay carries a rich and layered history that spans more than a century. Named after U.S. Secretary of State John Milton Hay, the camp served as a highland retreat during the American colonial period and later became a symbol of the enduring ties between the two nations.
                </p>
                <p className="mb-5" style={{ fontSize: '0.84rem', color: 'rgba(0,0,0,0.45)', lineHeight: 1.85 }}>
                  Today, Camp John Hay has been transformed into one of Baguio's premier leisure and lifestyle destinations, offering golf courses, nature trails, heritage museums, boutique accommodations, and a vibrant dining scene. The cool pine-scented air, colonial-era architecture, and sprawling forest grounds make it a beloved sanctuary for both locals escaping the city heat and travelers in search of highland tranquility.
                </p>
              </>}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}