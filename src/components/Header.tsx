import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode]           = useState<'login' | 'signup'>('login')
  const [username, setUsername]   = useState('')
  const [pw, setPw]               = useState('')
  const [pw2, setPw2]             = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [checkingId, setCheckingId] = useState(false)
  const [idAvail, setIdAvail]     = useState<boolean | null>(null)

useEffect(() => {
    setIdAvail(null)
    if (mode !== 'signup' || username.length < 2) return

    const timer = setTimeout(async () => {
        try {
            setCheckingId(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', username)
                .maybeSingle()
            if (error) throw error
            setIdAvail(!data) // data가 null이면 사용가능
        } catch {
            setIdAvail(null)
        } finally {
            setCheckingId(false)
        }
    }, 600)

    return () => clearTimeout(timer)
}, [username, mode])

  function reset() { setUsername(''); setPw(''); setPw2(''); setError(''); setIdAvail(null) }

  function validateUsername(id: string): string | null {
    if (id.length < 2) return '아이디는 2자 이상이어야 합니다'
    if (id.length > 20) return '아이디는 20자 이하여야 합니다'
    if (!/^[a-zA-Z0-9_]+$/.test(id)) return '아이디는 영문, 숫자, _ 만 사용 가능합니다'
    return null
  }

  function validatePassword(pw: string): string | null {
    if (pw.length < 6) return '비밀번호는 6자 이상이어야 합니다'
    if (pw.length > 12) return '비밀번호는 12자 이하여야 합니다'
    if (!/[a-zA-Z]/.test(pw)) return '비밀번호는 영문을 포함해야 합니다'
    if (!/[0-9]/.test(pw)) return '비밀번호는 숫자를 포함해야 합니다'
    return null
  }

  async function submit() {
    setError('')
    if (mode === 'login') {
      const fakeEmail = `${username}@webtoonhub.app`
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: pw })
      setLoading(false)
      if (error) { setError('아이디 또는 비밀번호가 올바르지 않습니다'); return }
      onClose()
    } else {
      const idErr = validateUsername(username)
      if (idErr) { setError(idErr); return }
      const pwErr = validatePassword(pw)
      if (pwErr) { setError(pwErr); return }
      if (pw !== pw2) { setError('비밀번호가 일치하지 않습니다'); return }
      if (idAvail === false) { setError('이미 사용 중인 아이디입니다'); return }
      if (idAvail === null) { setError('아이디 중복 확인 중입니다. 잠시 후 다시 시도해주세요'); return }

      const fakeEmail = `${username}@webtoonhub.app`
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email: fakeEmail, password: pw,
        options: { data: { username } },
      })
      setLoading(false)
      if (error) { setError('회원가입 오류: ' + error.message); return }
      onClose()
    }
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', marginBottom: 8,
    height: 44, padding: '0 14px', borderRadius: 10,
    border: '1.5px solid #e8e8e8', background: '#fafafa',
    fontSize: 14, color: '#111', outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box',
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: 360, boxShadow: '0 8px 40px rgba(0,0,0,.15)', animation: 'modalIn .2s ease' }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>

        <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1.5px solid #f0f0f0' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); reset() }}
              style={{ flex: 1, padding: '10px 0', fontSize: 15, fontWeight: mode === m ? 700 : 400, color: mode === m ? '#111' : '#aaa', background: 'none', border: 'none', borderBottom: mode === m ? '2.5px solid #03c75a' : '2.5px solid transparent', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2 }}>
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            style={{ ...inp, marginBottom: 0, paddingRight: mode === 'signup' ? 90 : 14, borderColor: mode === 'signup' && username ? (idAvail === true ? '#03c75a' : idAvail === false ? '#e24b4a' : '#e8e8e8') : '#e8e8e8' }}
            placeholder={mode === 'login' ? '아이디' : '아이디 (영문, 숫자, _)'}
            value={username} onChange={e => setUsername(e.target.value)}
            maxLength={20} autoComplete="username" />
          {mode === 'signup' && username && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: checkingId ? '#aaa' : idAvail === true ? '#03c75a' : idAvail === false ? '#e24b4a' : '#aaa' }}>
              {checkingId ? '확인중...' : idAvail === true ? '✓ 사용가능' : idAvail === false ? '✗ 중복' : ''}
            </div>
          )}
        </div>

        <input style={inp} type="password"
          placeholder={mode === 'login' ? '비밀번호' : '비밀번호 (영문+숫자 6~12자)'}
          value={pw} onChange={e => setPw(e.target.value)}
          maxLength={12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          onKeyDown={e => e.key === 'Enter' && mode === 'login' && submit()} />

        {mode === 'signup' && (
          <>
            <input style={{ ...inp, borderColor: pw2 && pw !== pw2 ? '#e24b4a' : '#e8e8e8' }}
              type="password" placeholder="비밀번호 확인"
              value={pw2} onChange={e => setPw2(e.target.value)}
              maxLength={12} autoComplete="new-password"
              onKeyDown={e => e.key === 'Enter' && submit()} />
            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8, lineHeight: 1.8 }}>
              <span style={{ color: pw.length >= 6 ? '#03c75a' : '#bbb' }}>✓ 6~12자</span>{'  '}
              <span style={{ color: /[a-zA-Z]/.test(pw) ? '#03c75a' : '#bbb' }}>✓ 영문</span>{'  '}
              <span style={{ color: /[0-9]/.test(pw) ? '#03c75a' : '#bbb' }}>✓ 숫자</span>
            </div>
          </>
        )}

        {error && (
          <div style={{ fontSize: 12, color: '#e24b4a', marginBottom: 10, padding: '8px 12px', background: '#fff5f5', borderRadius: 8 }}>{error}</div>
        )}

        <button onClick={submit} disabled={loading}
          style={{ width: '100%', height: 46, borderRadius: 10, background: loading ? '#aaa' : '#03c75a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>
        <button onClick={onClose}
          style={{ width: '100%', height: 38, borderRadius: 10, background: 'transparent', color: '#bbb', border: '1.5px solid #f0f0f0', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          취소
        </button>
      </div>
    </div>
  )
}

export default function Header({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const [username, setUsername] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    // 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
      if (data) setUsername(data.username)
    })
    // 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
        if (data) setUsername(data.username)
      } else {
        setUsername(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>

          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#03c75a,#00a040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>W</div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>
              웹툰<span style={{ color: '#03c75a' }}>허브</span>
            </span>
          </a>

          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <input placeholder="작품, 장르를 검색해 보세요" value={q} onChange={e => setQ(e.target.value)}
              style={{ width: '100%', height: 40, background: '#f4f4f4', border: '1.5px solid transparent', borderRadius: 20, padding: '0 44px 0 18px', fontSize: 14, color: '#111', outline: 'none', transition: 'border-color .15s', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#03c75a')}
              onBlur={e => (e.target.style.borderColor = 'transparent')} />
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}>🔍</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {username ? (
              <>
                <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{username}님</span>
                <button onClick={() => supabase.auth.signOut()}
                  style={{ fontSize: 13, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#03c75a', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                로그인
              </button>
            )}
          </div>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
