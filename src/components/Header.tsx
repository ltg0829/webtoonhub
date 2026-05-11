import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Header() {
  const [nickname, setNickname] = useState<string | null>(null)
  const [isAdmin, setIsAdmin]   = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [mode, setMode]         = useState<'login'|'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nick, setNick]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data } = await supabase
        .from('profiles').select('nickname, is_admin')
        .eq('id', session.user.id).single()
      if (data) { setNickname(data.nickname); setIsAdmin(data.is_admin) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles').select('nickname, is_admin')
          .eq('id', session.user.id).single()
        if (data) { setNickname(data.nickname); setIsAdmin(data.is_admin) }
      } else { setNickname(null); setIsAdmin(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setNickname(null); setIsAdmin(false)
  }

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setShowAuth(false)
      } else {
        if (nick.length < 2) throw new Error('닉네임은 2자 이상이어야 합니다')
        if (password.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다')
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { nickname: nick } } })
        if (error) throw error
        setShowAuth(false)
      }
    } catch(e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', marginBottom: 8,
    padding: '0 11px', height: 36,
    background: '#1e1e2a', border: '0.5px solid #2a2a3a',
    borderRadius: 7, color: '#f0ede6', fontSize: 13, outline: 'none',
  }

  return (
    <>
      <header style={{
        background:'#16161f', borderBottom:'0.5px solid #2a2a3a',
        padding:'0 1.25rem', height:52,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100,
      }}>
        <a href="/" style={{ textDecoration:'none' }}>
          <span style={{ fontFamily:"'Nanum Myeongjo',serif", fontSize:'1.2rem', fontWeight:700, color:'#f0ede6' }}>
            웹툰<span style={{ color:'#e8c84b' }}>허브</span>
          </span>
        </a>

        <nav style={{ display:'flex', alignItems:'center', gap:8 }}>
          {nickname ? (
            <>
              <span style={{ fontSize:12, color:'#7a7a8c' }}>{nickname}님</span>
              {isAdmin && (
                <a href="/admin" style={{
                  fontSize:12, padding:'5px 11px', borderRadius:6,
                  border:'0.5px solid #e8c84b', color:'#e8c84b', textDecoration:'none',
                }}>⚙️ 관리자</a>
              )}
              <button onClick={logout} style={{
                fontSize:12, padding:'5px 11px', borderRadius:6,
                border:'0.5px solid #2a2a3a', background:'transparent',
                color:'#7a7a8c', cursor:'pointer',
              }}>로그아웃</button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{
              fontSize:12, padding:'5px 12px', borderRadius:6,
              border:'none', background:'#e8c84b', color:'#000',
              fontWeight:600, cursor:'pointer',
            }}>로그인</button>
          )}
        </nav>
      </header>

      {showAuth && (
        <div onClick={e => e.target===e.currentTarget && setShowAuth(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.8)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:500,
        }}>
          <div style={{
            background:'#16161f', border:'0.5px solid #2a2a3a',
            borderRadius:14, padding:'1.75rem', width:300,
          }}>
            <div style={{ fontFamily:"'Nanum Myeongjo',serif", fontSize:'1.1rem', fontWeight:700, marginBottom:4 }}>
              웹툰허브 {mode==='login'?'로그인':'회원가입'}
            </div>
            <p style={{ fontSize:11, color:'#7a7a8c', marginBottom:'1rem', lineHeight:1.6 }}>
              {mode==='login'?'리뷰·댓글 작성은 로그인이 필요합니다':'닉네임과 이메일로 간편 가입'}
            </p>
            {mode==='signup' && (
              <input style={inp} placeholder="닉네임 (2자 이상)" maxLength={12}
                value={nick} onChange={e=>setNick(e.target.value)} />
            )}
            <input style={inp} type="email" placeholder="이메일"
              value={email} onChange={e=>setEmail(e.target.value)} />
            <input style={inp} type="password"
              placeholder={mode==='login'?'비밀번호':'비밀번호 (6자 이상)'}
              value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submit()} />
            {error && <p style={{ fontSize:11, color:'#e24b4a', marginBottom:8 }}>{error}</p>}
            <button onClick={submit} disabled={loading} style={{
              width:'100%', height:36, marginBottom:8,
              borderRadius:7, background:'#e8c84b', color:'#000',
              border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
            }}>
              {loading?'처리 중...':(mode==='login'?'로그인':'가입하기')}
            </button>
            <button onClick={()=>{setMode(mode==='login'?'signup':'login');setError('')}} style={{
              width:'100%', height:34, marginBottom:8,
              borderRadius:7, background:'transparent', color:'#7a7a8c',
              border:'0.5px solid #2a2a3a', fontSize:11, cursor:'pointer',
            }}>
              {mode==='login'?'계정이 없으신가요? 회원가입':'이미 계정이 있으신가요? 로그인'}
            </button>
            <button onClick={()=>setShowAuth(false)} style={{
              width:'100%', height:32,
              borderRadius:7, background:'transparent', color:'#7a7a8c',
              border:'0.5px solid #2a2a3a', fontSize:11, cursor:'pointer',
            }}>취소</button>
          </div>
        </div>
      )}
    </>
  )
}
