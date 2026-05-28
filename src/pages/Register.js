import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

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
  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50%       { background-position: 100% 50%; }
  }

  .reg-input {
    width: 100%;
    padding: 12px 16px;
    border: 1.5px solid #e8e8e8;
    border-radius: 8px;
    font-size: 0.92rem;
    color: #111;
    background: #fff;
    outline: none;
    transition: border-color .2s, box-shadow .2s;
    font-family: 'DM Sans', sans-serif;
  }
  .reg-input:focus {
    border-color: #111;
    box-shadow: 0 0 0 4px rgba(0,0,0,.06);
  }
  .reg-btn {
    transition: background .2s, transform .2s cubic-bezier(0.34,1.56,0.64,1), box-shadow .2s;
  }
  .reg-btn:hover {
    background: #333 !important;
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0,0,0,.15);
  }
  .back-link {
    transition: color .2s;
  }
  .back-link:hover { color: #111 !important; }

  .left-panel-bg {
    background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #111 100%);
    background-size: 200% 200%;
    animation: gradientShift 8s ease infinite;
  }
    @media (max-width: 640px) {
    .left-panel-bg { display: none !important; }
    .reg-right-panel {
      padding: 36px 24px !important;
      min-height: 100svh;
      align-items: flex-start !important;
      padding-top: 48px !important;
    }
    .reg-inner { max-width: 100% !important; }
    .reg-name-grid { grid-template-columns: 1fr !important; }
    .reg-gender-grid { grid-template-columns: 1fr !important; }
  }
`;

function anim(delay = 0, dir = 'up') {
  return {
    opacity: 0,
    animation: `${dir === 'up' ? 'fadeUp' : 'slideIn'} 0.65s ease ${delay}s forwards`,
  };
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'];

export default function Register() {
  const [personal, setPersonal] = useState({ firstName: '', middleName: '', lastName: '', gender: '', birthday: '' });
  const [account, setAccount] = useState({ username: '', password: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const nav = useNavigate();

  const passwordMatch = account.confirm.length > 0 && account.password === account.confirm;
  const passwordMismatch = account.confirm.length > 0 && account.password !== account.confirm;

  const getStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 8) return { label: 'Too short', color: '#e74c3c', width: '20%' };
    const has = { upper: /[A-Z]/.test(pw), lower: /[a-z]/.test(pw), num: /[0-9]/.test(pw), sym: /[^A-Za-z0-9]/.test(pw) };
    const score = Object.values(has).filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: '#e67e22', width: '40%' };
    if (score === 3) return { label: 'Fair', color: '#f1c40f', width: '65%' };
    return { label: 'Strong', color: '#27ae60', width: '100%' };
  };

  const strength = getStrength(account.password);

  const submit = async () => {
    setMsg('');
    if (!personal.firstName || !personal.lastName || !personal.gender || !personal.birthday)
      return setMsg('Please fill in all required personal information.');
    if (!account.username || !account.password || !account.confirm)
      return setMsg('Please fill in all account fields.');
    if (account.password !== account.confirm)
      return setMsg('Passwords do not match.');
    if (account.password.length < 8)
      return setMsg('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(account.password)) return setMsg('Password must contain at least one uppercase letter.');
    if (!/[a-z]/.test(account.password)) return setMsg('Password must contain at least one lowercase letter.');
    if (!/[0-9]/.test(account.password)) return setMsg('Password must contain at least one number.');
    if (!/[^A-Za-z0-9]/.test(account.password)) return setMsg('Password must contain at least one symbol.');
    try {
      const res = await API.post('/auth.php', {
        action: 'register',
        username: account.username,
        password: account.password,
        firstName: personal.firstName,
        middleName: personal.middleName,
        lastName: personal.lastName,
        gender: personal.gender,
        birthday: personal.birthday,
      });
      if (res.data.success) {
        setOk(true);
        setMsg('Account created! Redirecting to login...');
        setTimeout(() => nav('/login'), 1800);
      } else {
        setMsg(res.data.message || 'Registration failed.');
      }
    } catch {
      setMsg('Something went wrong. Please try again.');
    }
  };

  return (
    <>
      <style>{css}</style>

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
              Join.<br />
              <span style={{ color: 'rgba(255,255,255,0.28)' }}>Discover.</span><br />
              Explore.
            </h2>
            <div className="w-8 h-0.5 bg-white mb-4 rounded-full" />
            <p className="mb-8" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, maxWidth: '240px' }}>
              Create your account and unlock access to Baguio's documentary heritage spots.
            </p>
            {[
              '5 curated documentary spots',
              'Rich Cordilleran heritage content',
              'Free to explore after registration',
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
        <div className="reg-right-panel flex-1 flex items-start justify-center bg-white overflow-y-auto" style={{ padding: '48px 40px' }}>
          <div className="reg-inner w-full" style={{ maxWidth: '440px' }}>

            <Link
              to="/"
              className="back-link inline-flex items-center gap-1.5 font-bold uppercase tracking-wider no-underline mb-9"
              style={{ fontSize: '0.7rem', color: '#aaa', ...anim(0) }}
            >
              ← Back to Home
            </Link>

            {/* Step dots */}
            <div className="flex gap-1.5 mb-8" style={anim(0.08)}>
              {[true, true, false].map((active, i) => (
                <div key={i} className="rounded-full transition-all duration-300" style={{
                  height: '6px',
                  background: active ? '#111' : '#e0e0e0',
                  width: active ? '20px' : '6px',
                }} />
              ))}
            </div>

            <p className="font-bold uppercase tracking-widest text-gray-400 mb-2.5" style={{ fontSize: '0.6rem', letterSpacing: '0.2em', ...anim(0.1) }}>
              Create your account
            </p>
            <h1 className="font-black text-gray-900 mb-1.5" style={{ fontSize: '1.75rem', ...anim(0.18) }}>
              Register
            </h1>
            <p className="text-gray-400 mb-8 leading-relaxed" style={{ fontSize: '0.84rem', ...anim(0.26) }}>
              Fill in your details to get started.
            </p>

            {msg && (
              <div
                className="rounded-lg px-4 py-3 text-sm font-semibold mb-5"
                style={{
                  background: ok ? '#f0faf4' : '#fff5f5',
                  border: `1.5px solid ${ok ? '#a8ddb5' : '#ffd0d0'}`,
                  color: ok ? '#1e7e34' : '#c0392b',
                  ...anim(0),
                }}
              >
                {msg}
              </div>
            )}

            {/* ── PERSONAL INFORMATION ── */}
            <div style={anim(0.26)}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0" style={{ fontSize: '0.62rem', fontWeight: 800 }}>1</div>
                <div className="font-black uppercase tracking-widest text-gray-900" style={{ fontSize: '0.78rem' }}>Personal Information</div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* First + Last name */}
              <div className="reg-name-grid grid grid-cols-2 gap-3.5 mb-5">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="reg-input"
                    placeholder="Juan"
                    value={personal.firstName}
                    onChange={e => setPersonal({ ...personal, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="reg-input"
                    placeholder="dela Cruz"
                    value={personal.lastName}
                    onChange={e => setPersonal({ ...personal, lastName: e.target.value })}
                  />
                </div>
              </div>

              {/* Middle name */}
              <div className="mb-5">
                <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                  Middle Name <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="Santos"
                  value={personal.middleName}
                  onChange={e => setPersonal({ ...personal, middleName: e.target.value })}
                />
              </div>

              {/* Gender + Birthday */}
              <div className="reg-gender-grid grid grid-cols-2 gap-3.5 mb-8">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="reg-input"
                    style={{
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 14px center',
                    }}
                    value={personal.gender}
                    onChange={e => setPersonal({ ...personal, gender: e.target.value })}
                  >
                    <option value="">Select</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                    Birthday <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="reg-input"
                    style={{ colorScheme: 'light' }}
                    value={personal.birthday}
                    onChange={e => setPersonal({ ...personal, birthday: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* ── ACCOUNT INFORMATION ── */}
            <div style={anim(0.36)}>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center flex-shrink-0" style={{ fontSize: '0.62rem', fontWeight: 800 }}>2</div>
                <div className="font-black uppercase tracking-widest text-gray-900" style={{ fontSize: '0.78rem' }}>Account Information</div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Username */}
              <div className="mb-5">
                <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  className="reg-input"
                  placeholder="e.g. juan_delacruz"
                  value={account.username}
                  onChange={e => setAccount({ ...account, username: e.target.value })}
                />
              </div>

              {/* Password */}
              <div className="mb-2">
                <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  className="reg-input"
                  placeholder="Min. 8 characters"
                  value={account.password}
                  onChange={e => setAccount({ ...account, password: e.target.value })}
                />
              </div>

              {/* Strength bar */}
              <div className="mb-5" style={{ opacity: 1, minHeight: strength ? 'auto' : 0 }}>
                {strength && (
                  <>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
                      <div style={{
                        height: '100%',
                        width: strength.width,
                        background: strength.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease, background 0.3s ease',
                      }} />
                    </div>
                    <div className="mt-1 font-semibold" style={{ fontSize: '0.7rem', color: strength.color }}>
                      {strength.label}
                    </div>
                  </>
                )}
              </div>

              {/* Password requirements */}
              <div className="mb-5 flex flex-col gap-1.5" style={{ opacity: 1 }}>
                {[
                  { label: 'At least 8 characters',      pass: account.password.length >= 8 },
                  { label: 'One uppercase letter (A-Z)', pass: /[A-Z]/.test(account.password) },
                  { label: 'One lowercase letter (a-z)', pass: /[a-z]/.test(account.password) },
                  { label: 'One number (0-9)',            pass: /[0-9]/.test(account.password) },
                  { label: 'One symbol (!@#$...)',        pass: /[^A-Za-z0-9]/.test(account.password) },
                ].map(({ label, pass }) => (
                  <div key={label} className="flex items-center gap-1.5 font-semibold" style={{ fontSize: '0.7rem', color: pass ? '#27ae60' : '#aaa' }}>
                    <span style={{ fontSize: '0.75rem' }}>{pass ? '✓' : '○'}</span>
                    {label}
                  </div>
                ))}
              </div>

              {/* Confirm password */}
              <div className="mb-2">
                <label className="block font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ fontSize: '0.68rem' }}>
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    className="reg-input"
                    style={{
                      borderColor: passwordMatch ? '#27ae60' : passwordMismatch ? '#e74c3c' : '#e8e8e8',
                      paddingRight: '42px',
                    }}
                    placeholder="Re-enter password"
                    value={account.confirm}
                    onChange={e => setAccount({ ...account, confirm: e.target.value })}
                  />
                  {(passwordMatch || passwordMismatch) && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ fontSize: '1rem', color: passwordMatch ? '#27ae60' : '#e74c3c' }}>
                      {passwordMatch ? '✓' : '✗'}
                    </div>
                  )}
                </div>
                {passwordMismatch && (
                  <div className="mt-1 font-semibold" style={{ fontSize: '0.7rem', color: '#e74c3c' }}>Passwords do not match</div>
                )}
                {passwordMatch && (
                  <div className="mt-1 font-semibold" style={{ fontSize: '0.7rem', color: '#27ae60' }}>Passwords match</div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-7" style={anim(0.5)}>
              <button
                onClick={submit}
                className="reg-btn w-full text-white font-black uppercase tracking-wider rounded-lg py-3.5 border-none cursor-pointer"
                style={{ background: '#111', fontSize: '0.76rem', letterSpacing: '0.12em' }}
              >
                Create Account
              </button>
            </div>

            <p className="text-center mt-6 text-gray-400" style={{ fontSize: '0.8rem', ...anim(0.56) }}>
              Already have an account?{' '}
              <Link to="/login" className="text-gray-900 font-black no-underline" style={{ borderBottom: '1.5px solid #111' }}>
                Sign in
              </Link>
            </p>

            <div className="h-12" />
          </div>
        </div>

      </div>
    </>
  );
}