import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../services/api';
import { PublicClientApplication } from '@azure/msal-browser';

const MSAL_CONFIG = {
  auth: {
    clientId: '8b151c4c-b5e8-4332-8bde-a4fc750734a2',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: `${window.location.origin}/auth-redirect.html`,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    allowNativeBroker: false,
    windowHashTimeout: 9000,
    iframeHashTimeout: 9000,
    loadFrameTimeout: 9000,
  },
};
const msalInstance = new PublicClientApplication(MSAL_CONFIG);
const msalInitPromise = msalInstance.initialize();

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700;9..40,800;9..40,900&display=swap');
  * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: .18; }
    50%       { opacity: .32; }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.93) translateY(16px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }

  .login-input {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #e8e8e8;
    border-radius: 8px;
    font-size: 0.92rem;
    color: #111;
    background: #fff;
    margin-bottom: 18px;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    font-family: 'DM Sans', sans-serif;
  }
  .login-input:focus {
    border-color: #111;
    box-shadow: 0 0 0 4px rgba(0,0,0,.06);
  }
  .login-btn {
    transition: background .2s, transform .2s cubic-bezier(0.34,1.56,0.64,1), box-shadow .2s;
  }
  .login-btn:hover {
    background: #333 !important;
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0,0,0,.15);
  }
  .ms-btn {
    transition: border-color .2s, box-shadow .2s, transform .2s;
  }
  .ms-btn:hover {
    border-color: #0078d4 !important;
    box-shadow: 0 0 0 3px rgba(0,120,212,0.1);
    transform: translateY(-1px);
  }
  .back-link {
    transition: color .2s, gap .2s;
  }
  .back-link:hover { color: #111 !important; }

  @media (max-width: 640px) {
    .left-panel-bg { display: none !important; }
    .login-right-panel {
      padding: 36px 24px !important;
      min-height: 100svh;
      justify-content: flex-start !important;
      padding-top: 48px !important;
    }
    .login-inner { max-width: 100% !important; }
  }

  .left-panel-bg {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #111 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
  }

  @keyframes waveDot {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40%           { transform: translateY(-6px); opacity: 1; }
  }
  .wave-dot {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #fff;
    animation: waveDot 1.2s ease infinite;
  }
  .wave-dot:nth-child(2) { animation-delay: 0.18s; }
  .wave-dot:nth-child(3) { animation-delay: 0.36s; }
`;

function anim(delay = 0, dir = 'up') {
  return {
    opacity: 0,
    animation: `${dir === 'up' ? 'fadeUp' : 'slideIn'} 0.65s ease ${delay}s forwards`,
  };
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];

const focusInput = e => { e.target.style.borderColor = '#111'; e.target.style.boxShadow = '0 0 0 4px rgba(0,0,0,.06)'; };
const blurInput  = e => { e.target.style.borderColor = '#e8e8e8'; e.target.style.boxShadow = 'none'; };

function CompleteProfileModal({ microsoftData, onDone }) {
  const [personal, setPersonal] = useState({
    firstName:  microsoftData.name?.split(' ')[0] || '',
    middleName: '',
    lastName:   microsoftData.name?.split(' ').slice(1).join(' ') || '',
    gender: '', birthday: '',
  });
  const [username, setUsername] = useState(
    microsoftData.email?.split('@')[0]?.replace(/[^a-z0-9_]/gi, '_') || ''
  );
  const [msg, setMsg]       = useState('');
  const [saving, setSaving] = useState(false);

  const modalInputStyle = {
    width: '100%', padding: '12px 16px', border: '1.5px solid #e8e8e8',
    borderRadius: '8px', fontSize: '0.92rem', color: '#111', background: '#fff',
    outline: 'none', transition: 'border-color .2s, box-shadow .2s', boxSizing: 'border-box',
    fontFamily: "'DM Sans', sans-serif",
  };

  async function submit() {
    setMsg('');
    if (!personal.firstName || !personal.lastName || !personal.gender || !personal.birthday)
      return setMsg('Please fill in all required personal fields.');
    if (!username.trim()) return setMsg('Please enter a username.');
    setSaving(true);
    try {
      const res = await API.post('/auth.php', {
        action: 'microsoft_complete', microsoft_id: microsoftData.microsoft_id,
        username: username.trim(), firstName: personal.firstName,
        middleName: personal.middleName, lastName: personal.lastName,
        gender: personal.gender, birthday: personal.birthday,
      });
      if (res.data.success) onDone(res.data);
      else setMsg(res.data.message || 'Something went wrong.');
    } catch { setMsg('Something went wrong. Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-2xl w-full overflow-y-auto" style={{ maxWidth: 480, maxHeight: '90vh', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', animation: 'modalIn 0.28s ease forwards' }}>
        {/* Prevent browser autofill */}
        <input type="text" autoComplete="username" style={{ display: 'none' }} readOnly />
        <input type="password" autoComplete="current-password" style={{ display: 'none' }} readOnly />

        <div className="px-7 pt-6 pb-0">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0078d4' }}>
              <svg width="18" height="18" viewBox="0 0 21 21" fill="#fff"><rect x="1" y="1" width="9" height="9"/><rect x="11" y="1" width="9" height="9"/><rect x="1" y="11" width="9" height="9"/><rect x="11" y="11" width="9" height="9"/></svg>
            </div>
            <div>
              <div className="font-black text-gray-900" style={{ fontSize: '1rem' }}>Complete your profile</div>
              <div className="text-gray-400" style={{ fontSize: '0.72rem' }}>Signed in as <strong>{microsoftData.email}</strong></div>
            </div>
          </div>
          <div className="h-px bg-gray-100 mt-5" />
        </div>

        <div className="px-7 py-5 flex flex-col gap-4">
          {msg && <div className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: '#fff5f5', border: '1.5px solid #ffd0d0', color: '#c0392b' }}>{msg}</div>}

          <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-gray-900">
            <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0" style={{ fontSize: '0.62rem' }}>1</div>
            Personal Information
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">First Name <span className="text-red-500">*</span></label>
              <input autoComplete="off" style={modalInputStyle} placeholder="Juan" value={personal.firstName} onChange={e => setPersonal({ ...personal, firstName: e.target.value })} onFocus={focusInput} onBlur={blurInput}/>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Last Name <span className="text-red-500">*</span></label>
              <input autoComplete="off" style={modalInputStyle} placeholder="dela Cruz" value={personal.lastName} onChange={e => setPersonal({ ...personal, lastName: e.target.value })} onFocus={focusInput} onBlur={blurInput}/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Middle Name <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span></label>
            <input autoComplete="off" style={modalInputStyle} placeholder="Santos" value={personal.middleName} onChange={e => setPersonal({ ...personal, middleName: e.target.value })} onFocus={focusInput} onBlur={blurInput}/>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Gender <span className="text-red-500">*</span></label>
              <select style={{ ...modalInputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}
                value={personal.gender} onChange={e => setPersonal({ ...personal, gender: e.target.value })} onFocus={focusInput} onBlur={blurInput}>
                <option value="">Select</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Birthday <span className="text-red-500">*</span></label>
              <input type="date" style={{ ...modalInputStyle, colorScheme: 'light' }} value={personal.birthday} onChange={e => setPersonal({ ...personal, birthday: e.target.value })} onFocus={focusInput} onBlur={blurInput}/>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-gray-900 mt-1">
            <div className="w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0" style={{ fontSize: '0.62rem' }}>2</div>
            Account
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Username <span className="text-red-500">*</span></label>
            <input autoComplete="off" style={modalInputStyle} placeholder="e.g. juan_delacruz" value={username} onChange={e => setUsername(e.target.value)} onFocus={focusInput} onBlur={blurInput}/>
          </div>

          <button
            onClick={submit} disabled={saving}
            className="login-btn w-full text-white font-black uppercase tracking-wider rounded-lg py-3.5 border-none cursor-pointer mt-1"
            style={{ background: '#111', fontSize: '0.74rem', letterSpacing: '0.12em' }}
          >
            {saving ? 'Saving…' : 'Complete Registration'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [msLoading, setMsLoading] = useState(false);
  const [msProfile, setMsProfile] = useState(null);
  const nav = useNavigate();

  React.useEffect(() => {
    msalInitPromise.then(async () => {
      try {
        const result = await msalInstance.handleRedirectPromise();
        if (result?.account) {
          const acct = result.account;
          const res = await API.post('/auth.php', {
            action: 'microsoft_login',
            microsoft_id: acct.homeAccountId,
            email: acct.username,
            name: acct.name,
          });
          if (res.data.success) {
            localStorage.setItem('cv_user', JSON.stringify(res.data));
            sessionStorage.setItem('cv_just_logged_in', 'true');
            window.location.replace('/dashboard');
          } else if (res.data.needs_profile) {
            setMsProfile(res.data);
          }
        }
      } catch(e) { console.error(e); }
    });
  }, []);

  const location = useLocation();
  const from = location.state?.from || null;

  const submit = async () => {
    if (loading) return;
    setErr('');
    setLoading(true);
    try {
      const res = await API.post('/auth.php', { action: 'login', ...form });
      if (res.data.success) {
        localStorage.setItem('cv_user', JSON.stringify(res.data));
        sessionStorage.setItem('cv_just_logged_in', 'true');
        const dest = res.data.role === 'admin' ? '/admin' : (location.state?.from || '/dashboard');
        window.location.replace(dest);
      } else {
        setErr(res.data.message);
        setLoading(false);
      }
    } catch {
      setErr('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  async function loginWithMicrosoft() {
    setErr(''); setMsLoading(true);
    try {
      await msalInitPromise;
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) msalInstance.setActiveAccount(accounts[0]);
      await msalInstance.loginRedirect({
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        prompt: 'select_account',
        redirectUri: `${window.location.origin}/login`,
      });
    } catch (e) {
      console.error('MSAL error:', e);
      if (e?.errorCode === 'interaction_in_progress') sessionStorage.clear();
      else if (e?.errorCode === 'user_cancelled' || e?.errorCode === 'access_denied') {}
      else setErr(e?.message || e?.errorCode || 'Microsoft sign-in failed. Please try again.');
    } finally { setMsLoading(false); }
  }

  const fields = [
    { label: 'Username', key: 'username', type: 'text',     placeholder: 'Enter your username', delay: 0.32 },
    { label: 'Password', key: 'password', type: 'password', placeholder: 'Enter your password', delay: 0.40 },
  ];

  return (
    <>
      <style>{css}</style>

      {msProfile && (
        <CompleteProfileModal
          microsoftData={msProfile}
          onDone={data => {
            localStorage.setItem('cv_user', JSON.stringify(data));
            sessionStorage.setItem('cv_just_logged_in', 'true');
            window.location.replace('/dashboard');
          }}
        />
      )}

      <div className="flex min-h-screen">

        {/* ── LEFT BRANDING PANEL ── */}
        <div
          className="left-panel-bg relative flex flex-col justify-between overflow-hidden"
          style={{ width: '42%', minWidth: '300px', padding: '48px 44px' }}
        >
          {/* Geometric SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 360 700" preserveAspectRatio="xMidYMid slice">
            <circle cx="320" cy="80"  r="110" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
            <circle cx="320" cy="80"  r="70"  fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1"/>
            <circle cx="40"  cy="600" r="140" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1"/>
            <line x1="0"   y1="340" x2="360" y2="340" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
            <line x1="180" y1="0"   x2="180" y2="700" stroke="rgba(255,255,255,.04)" strokeWidth="1"/>
            <rect x="260" y="200" width="60" height="60" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" style={{ animation: 'spinSlow 18s linear infinite', transformOrigin: '290px 230px' }}/>
            <rect x="268" y="208" width="44" height="44" fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="1" style={{ animation: 'spinSlow 18s linear infinite reverse', transformOrigin: '290px 230px' }}/>
            <circle cx="60"  cy="200" r="4" fill="rgba(255,255,255,.25)" style={{ animation: 'pulse 3s ease infinite' }}/>
            <circle cx="300" cy="420" r="3" fill="rgba(255,255,255,.2)"  style={{ animation: 'pulse 4s ease .8s infinite' }}/>
            <circle cx="180" cy="560" r="5" fill="rgba(255,255,255,.15)" style={{ animation: 'pulse 3.5s ease .4s infinite' }}/>
            <path d="M 60 200 L 300 420" stroke="rgba(255,255,255,.06)" strokeWidth="1" strokeDasharray="5 5"/>
            <path d="M 300 420 L 180 560" stroke="rgba(255,255,255,.06)" strokeWidth="1" strokeDasharray="5 5"/>
          </svg>

          {/* Brand mark */}
          <div className="relative z-10" style={anim(0, 'left')}>
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="ClickVentures" className="w-10 h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="text-white font-black uppercase tracking-widest" style={{ fontSize: '0.78rem', letterSpacing: '0.18em' }}>
                CLICKVENTURES
              </span>
            </div>
          </div>

          {/* Tagline */}
          <div className="relative z-10" style={anim(0.2, 'left')}>
            <p className="font-bold uppercase tracking-widest mb-4" style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.38)' }}>
              Baguio City Tourism
            </p>
            <h2 className="font-black text-white mb-5" style={{ fontSize: '2rem', lineHeight: 1.2 }}>
              Discover.<br />
              <span style={{ color: 'rgba(255,255,255,0.28)' }}>Document.</span><br />
              Explore.
            </h2>
            <div className="w-8 h-0.5 bg-white mb-4 rounded-full" />
            <p className="mb-8" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: '240px' }}>
              Your gateway to the cultural and documentary heritage of the City of Pines.
            </p>
            {[
              '5 curated documentary spots',
              'Rich Cordilleran heritage content',
              'Free to explore after login',
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.52)' }}>{f}</span>
              </div>
            ))}
          </div>

          <div className="relative z-10 font-bold uppercase tracking-widest" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em' }}>
            © {new Date().getFullYear()} CLICKVENTURES
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div className="login-right-panel flex-1 flex items-center justify-center bg-white px-10 py-12">
          <div className="login-inner w-full" style={{ maxWidth: '380px' }}>

            <Link
              to="/"
              className="back-link inline-flex items-center gap-1.5 font-bold uppercase tracking-wider no-underline mb-9"
              style={{ fontSize: '0.7rem', color: '#aaa', ...anim(0) }}
            >
              ← Back to Home
            </Link>

            {/* Step dots */}
            <div className="flex gap-1.5 mb-8" style={anim(0.08)}>
              {[true, false, false].map((active, i) => (
                <div key={i} className="rounded-full transition-all duration-300" style={{
                  height: '6px',
                  background: active ? '#111' : '#e0e0e0',
                  width: active ? '20px' : '6px',
                }} />
              ))}
            </div>

            <p className="font-bold uppercase tracking-widest text-gray-400 mb-2.5" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', ...anim(0.1) }}>
              Welcome back
            </p>
            <h1 className="font-black text-gray-900 mb-1.5" style={{ fontSize: '1.75rem', ...anim(0.18) }}>
              Sign in
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed" style={{ fontSize: '0.84rem', ...anim(0.26) }}>
              Log in to access Baguio's documentary spots.
            </p>

            {err && (
              <div className="rounded-lg px-4 py-3 text-sm font-semibold mb-5" style={{ background: '#fff5f5', border: '1.5px solid #ffd0d0', color: '#c0392b' }}>
                {err}
              </div>
            )}

            {fields.map(({ label, key, type, placeholder, delay }) => (
              <div key={key} style={anim(delay)}>
                <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                  {label}
                </label>
                <input
                  className="login-input"
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                />
              </div>
            ))}

            <button
              onClick={submit}
              disabled={loading}
              className="login-btn w-full text-white font-black uppercase tracking-wider rounded-lg py-3.5 border-none cursor-pointer"
              style={{ background: '#111', fontSize: '0.76rem', letterSpacing: '0.12em', ...anim(0.5), opacity: loading ? 0.85 : 1 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="wave-dot" />
                  <span className="wave-dot" />
                  <span className="wave-dot" />
                </span>
              ) : 'Login'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5" style={anim(0.54)}>
              <div className="flex-1 h-px bg-gray-100" />
              <span className="font-semibold text-gray-300 tracking-wider" style={{ fontSize: '0.66rem' }}>OR</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Microsoft Button */}
            <button
              onClick={() => { if (!msLoading) loginWithMicrosoft(); }}
              className="ms-btn w-full bg-white text-gray-900 font-bold rounded-lg py-3 flex items-center justify-center gap-2.5 cursor-pointer border border-gray-200"
              style={{ fontSize: '0.76rem', ...anim(0.56) }}
            >
              <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              {msLoading ? 'Connecting…' : 'Continue with Microsoft'}
            </button>

            <p className="text-center mt-6 text-gray-400" style={{ fontSize: '0.8rem', ...anim(0.58) }}>
              No account yet?{' '}
              <Link to="/register" className="text-gray-900 font-black no-underline" style={{ borderBottom: '1.5px solid #111' }}>
                Create one
              </Link>
            </p>

          </div>
        </div>

      </div>
    </>
  );
}