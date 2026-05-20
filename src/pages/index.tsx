import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work, PLATFORM_COLORS } from '@/lib/supabase'

const DAYS = ['전체', '월', '화', '수', '목', '금', '토', '일']
const DAY_MAP = ['일', '월', '화', '수', '목', '금', '토']

export function getPlatColor(p: string) { return PLATFORM_COLORS[p] || '#888' }
export function getPlatIcon(p: string) {
  if (p.includes('네이버')) return 'N'
  if (p.includes('카카오')) return 'K'
  if (p.includes('레진')) return 'L'
  if (p.includes('리디')) return 'R'
  if (p.includes('탑툰')) return 'T'
  return p[0]
}

// ── 유효성 검사 ──────────────────────────────────
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

// ── 로그인/회원가입 모달 ──────────────────────────
export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode]           = useState<'login' | 'signup'>('login')
  const [username, setUsername]   = useState('')
  const [pw, setPw]               = useState('')
  const [pw2, setPw2]             = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [checkingId, setCheckingId] = useState(false)
  const [idAvail, setIdAvail]     = useState<boolean | null>(null)

  // 아이디 중복 체크 (회원가입 모드에서 입력 멈추면)
  useEffect(() => {
    if (mode !== 'signup' || !username) { setIdAvail(null); return }
    const err = validateUsername(username)
    if (err) { setIdAvail(null); return }
    const timer = setTimeout(async () => {
      setCheckingId(true)
      const { data } = await supabase.from('profiles').select('id').eq('username', username).single()
      setIdAvail(!data)
      setCheckingId(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [username, mode])

  function reset() { setUsername(''); setPw(''); setPw2(''); setError(''); setIdAvail(null) }

  async function submit() {
    setError('')
    if (mode === 'login') {
      // 로그인: username → email 형식으로 변환 (Supabase는 이메일 기반)
      const fakeEmail = `${username}@webtoonhub.app`
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password: pw })
      setLoading(false)
      if (error) { setError('아이디 또는 비밀번호가 올바르지 않습니다'); return }
      onClose()
    } else {
      // 회원가입 유효성 검사
      const idErr = validateUsername(username)
      if (idErr) { setError(idErr); return }
      const pwErr = validatePassword(pw)
      if (pwErr) { setError(pwErr); return }
      if (pw !== pw2) { setError('비밀번호가 일치하지 않습니다'); return }
      if (idAvail === false) { setError('이미 사용 중인 아이디입니다'); return }
      if (idAvail === null) { setError('아이디 중복 확인이 필요합니다'); return }

      const fakeEmail = `${username}@webtoonhub.app`
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: pw,
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

        {/* 탭 */}
        <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1.5px solid #f0f0f0' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); reset() }}
              style={{ flex: 1, padding: '10px 0', fontSize: 15, fontWeight: mode === m ? 700 : 400, color: mode === m ? '#111' : '#aaa', background: 'none', border: 'none', borderBottom: mode === m ? '2.5px solid #03c75a' : '2.5px solid transparent', cursor: 'pointer', fontFamily: 'inherit', marginBottom: -2 }}>
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 아이디 */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input style={{ ...inp, marginBottom: 0, paddingRight: mode === 'signup' ? 80 : 14, borderColor: mode === 'signup' && username ? (idAvail === true ? '#03c75a' : idAvail === false ? '#e24b4a' : '#e8e8e8') : '#e8e8e8' }}
            placeholder={mode === 'login' ? '아이디' : '아이디 (영문, 숫자, _ 사용 가능)'}
            value={username} onChange={e => setUsername(e.target.value)}
            maxLength={20} autoComplete="username" />
          {mode === 'signup' && username && (
            <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 600, color: checkingId ? '#aaa' : idAvail === true ? '#03c75a' : idAvail === false ? '#e24b4a' : '#aaa' }}>
              {checkingId ? '확인중...' : idAvail === true ? '✓ 사용가능' : idAvail === false ? '✗ 중복' : ''}
            </div>
          )}
        </div>

        {/* 비밀번호 */}
        <input style={inp} type="password"
          placeholder={mode === 'login' ? '비밀번호' : '비밀번호 (영문+숫자 6~12자)'}
          value={pw} onChange={e => setPw(e.target.value)}
          maxLength={12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          onKeyDown={e => e.key === 'Enter' && mode === 'login' && submit()} />

        {/* 비밀번호 확인 (회원가입) */}
        {mode === 'signup' && (
          <input style={{ ...inp, borderColor: pw2 && pw !== pw2 ? '#e24b4a' : '#e8e8e8' }}
            type="password" placeholder="비밀번호 확인"
            value={pw2} onChange={e => setPw2(e.target.value)}
            maxLength={12} autoComplete="new-password"
            onKeyDown={e => e.key === 'Enter' && submit()} />
        )}

        {/* 비밀번호 조건 안내 (회원가입) */}
        {mode === 'signup' && (
          <div style={{ fontSize: 11, color: '#bbb', marginBottom: 8, lineHeight: 1.6 }}>
            {pw.length >= 6 ? <span style={{ color: '#03c75a' }}>✓</span> : '·'} 6자 이상 12자 이하&nbsp;&nbsp;
            {/[a-zA-Z]/.test(pw) ? <span style={{ color: '#03c75a' }}>✓</span> : '·'} 영문 포함&nbsp;&nbsp;
            {/[0-9]/.test(pw) ? <span style={{ color: '#03c75a' }}>✓</span> : '·'} 숫자 포함
          </div>
        )}

        {/* 오류 메시지 */}
        {error && <div style={{ fontSize: 12, color: '#e24b4a', marginBottom: 10, padding: '8px 12px', background: '#fff5f5', borderRadius: 8 }}>{error}</div>}

        {/* 버튼 */}
        <button onClick={submit} disabled={loading}
          style={{ width: '100%', height: 46, borderRadius: 10, background: loading ? '#aaa' : '#03c75a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 10, transition: 'background .15s' }}>
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

// ── 헤더 ─────────────────────────────────────────
export function SiteHeader({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const [username, setUsername] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
      setUsername(data?.username || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', session.user.id).single()
        setUsername(data?.username || null)
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

          {/* 로고 */}
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#03c75a,#00a040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>W</div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>
              웹툰<span style={{ color: '#03c75a' }}>허브</span>
            </span>
          </a>

          {/* 검색 */}
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <input placeholder="작품, 장르를 검색해 보세요" value={q} onChange={e => setQ(e.target.value)}
              style={{ width: '100%', height: 40, background: '#f4f4f4', border: '1.5px solid transparent', borderRadius: 20, padding: '0 44px 0 18px', fontSize: 14, color: '#111', outline: 'none', transition: 'border-color .15s', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#03c75a')}
              onBlur={e => (e.target.style.borderColor = 'transparent')} />
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}>🔍</div>
          </div>

          {/* 로그인/유저 영역 */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {username ? (
              <>
                <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{username}님</span>
                <button onClick={() => supabase.auth.signOut()}
                  style={{ fontSize: 13, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ccc' }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e8e8e8' }}>
                  로그아웃
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)}
                style={{ fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#03c75a', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.opacity = '.88' }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}>
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

// ── 워크카드 ──────────────────────────────────────
export function WorkCard({ work, onClick }: { work: Work; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const platColor = getPlatColor(work.platform)
  const platIcon  = getPlatIcon(work.platform)

  return (
    <div onClick={onClick} onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{ cursor: 'pointer', transition: 'transform .18s', transform: hovered ? 'translateY(-4px)' : 'none' }}>
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 8, boxShadow: hovered ? '0 8px 24px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,.08)', transition: 'box-shadow .18s', aspectRatio: '3/4', background: work.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        {work.emoji}
        {work.is_ended ? (
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: 'rgba(0,0,0,.55)', color: '#fff' }}>완결</div>
        ) : work.schedule ? (
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: '#03c75a', color: '#fff' }}>{work.schedule}</div>
        ) : null}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 5, background: platColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>{platIcon}</div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.35, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{work.title}</div>
      <div style={{ fontSize: 11, color: '#999' }}>{work.genre || '—'}</div>
    </div>
  )
}

// ── 워크시트 ──────────────────────────────────────
export function WorkSheet({ work, onClose }: { work: Work; onClose: () => void }) {
  const platColor = getPlatColor(work.platform)
  const platIcon  = getPlatIcon(work.platform)

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '85vh', overflow: 'auto', padding: '0 0 40px', animation: 'sheetUp .22s ease' }}>
        <style>{`@keyframes sheetUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{ textAlign: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#e0e0e0', display: 'inline-block' }} />
        </div>
        <div style={{ display: 'flex', gap: 16, padding: '16px 20px 20px' }}>
          <div style={{ width: 90, height: 120, borderRadius: 10, background: work.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>{work.emoji}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#111', lineHeight: 1.3, marginBottom: 8 }}>{work.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {([['플랫폼', work.platform], ['장르', work.genre || '—'], ['연재 요일', work.schedule ? work.schedule + '요일' : '—'], ['상태', work.is_ended ? '완결' : '연재중']] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#aaa', width: 55, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: k === '상태' ? (work.is_ended ? '#888' : '#03c75a') : '#333', fontWeight: k === '상태' ? 600 : 400 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ height: 1, background: '#f0f0f0', margin: '0 20px' }} />
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 11, color: '#aaa', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>플랫폼 바로가기</div>
          {work.page_link ? (
            <a href={work.page_link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, background: platColor, cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseOver={e => (e.currentTarget.style.opacity = '.88')}
                onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>{platIcon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{work.platform}에서 보기</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 1 }}>{work.page_link.replace(/^https?:\/\//, '').split('/')[0]}</div>
                  </div>
                </div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,.9)' }}>→</div>
              </div>
            </a>
          ) : (
            <div style={{ padding: '14px 18px', borderRadius: 12, background: '#f5f5f5', fontSize: 13, color: '#aaa', textAlign: 'center' }}>등록된 링크가 없습니다</div>
          )}
        </div>
        <div style={{ padding: '12px 20px 0' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 12, border: '1.5px solid #e8e8e8', background: '#fff', fontSize: 14, color: '#555', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>닫기</button>
        </div>
      </div>
    </div>
  )
}

// ── 공통 ──────────────────────────────────────────
export function LoadingSpinner() {
  return (
    <div style={{ padding: '80px', textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #e8e8e8', borderTopColor: '#03c75a', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px', color: '#aaa' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#555', marginBottom: 6 }}>검색 결과가 없어요</div>
      <div style={{ fontSize: 13 }}>다른 검색어나 필터를 사용해보세요</div>
    </div>
  )
}

// ── 메인 페이지 ───────────────────────────────────
export default function Home() {
  const today = DAY_MAP[new Date().getDay()]

  const [works, setWorks]     = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [selWork, setSelWork] = useState<Work | null>(null)
  const [q, setQ]             = useState('')
  const [selPlat, setSelPlat] = useState('all')
  const [selDay, setSelDay]   = useState(today)
  const [sortBy, setSortBy]   = useState<'title' | 'platform' | 'genre'>('title')

  useEffect(() => { fetchWorks() }, [])

  async function fetchWorks() {
    setLoading(true)
    try {
      const all: Work[] = []
      let from = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from('works').select('*').eq('is_ended', false).order('title').range(from, from + 999)
        if (error || !data || data.length === 0) { hasMore = false; break }
        all.push(...(data as Work[]))
        hasMore = data.length === 1000
        from += 1000
      }
      setWorks(all)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const platforms = useMemo(() => {
    const set = new Set(works.map(w => w.platform))
    return ['all', ...Array.from(set)]
  }, [works])

  const filtered = useMemo(() => {
    let list = works.filter(w => {
      if (selPlat !== 'all' && w.platform !== selPlat) return false
      if (selDay !== '전체' && w.schedule !== selDay) return false
      if (q && !w.title.includes(q) && !w.platform.includes(q) && !(w.genre || '').includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => {
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      if (sortBy === 'genre')    return (a.genre || '').localeCompare(b.genre || '')
      return a.title.localeCompare(b.title)
    })
  }, [works, selPlat, selDay, q, sortBy])

  return (
    <>
      <Head><title>웹툰허브 — 연재중 웹툰</title></Head>
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: '#f8f8f8', minHeight: '100vh' }}>

        <SiteHeader q={q} setQ={setQ} />

        {/* 탭 + 필터 */}
        <div style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 60, zIndex: 90 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

            {/* 연재 / 완결 탭 + 요일 */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <a href="/" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, color: '#03c75a', borderBottom: '2.5px solid #03c75a', whiteSpace: 'nowrap', marginBottom: -1 }}>🟢 연재중</div>
              </a>
              <a href="/ended" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: 14, fontWeight: 400, color: '#888', borderBottom: '2.5px solid transparent', whiteSpace: 'nowrap', marginBottom: -1 }}>✅ 완결</div>
              </a>
              <div style={{ width: 1, height: 18, background: '#e8e8e8', margin: '0 8px', flexShrink: 0 }} />
              {DAYS.map(d => {
                const active = selDay === d
                return (
                  <button key={d} onClick={() => setSelDay(d)}
                    style={{ padding: '13px 11px', fontSize: 13, fontWeight: active ? 700 : 400, color: active ? '#111' : '#888', background: 'none', border: 'none', borderBottom: active ? '2.5px solid #111' : '2.5px solid transparent', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', marginBottom: -1, flexShrink: 0 }}>
                    {d === '전체' ? '전체요일' : d + '요일'}
                  </button>
                )
              })}
            </div>

            {/* 플랫폼 칩 + 정렬 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {platforms.map(p => {
                const active = selPlat === p
                const col = p === 'all' ? '#111' : getPlatColor(p)
                return (
                  <button key={p} onClick={() => setSelPlat(p)}
                    style={{ fontSize: 12, padding: '5px 13px', borderRadius: 20, border: `1.5px solid ${active ? col : '#e0e0e0'}`, background: active ? col : '#fff', color: active ? '#fff' : '#555', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: active ? 600 : 400, fontFamily: 'inherit', transition: 'all .15s' }}>
                    {p === 'all' ? '전체 플랫폼' : p}
                  </button>
                )
              })}
              <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', color: '#555', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
                  <option value="title">가나다순</option>
                  <option value="platform">플랫폼순</option>
                  <option value="genre">장르순</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 그리드 */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 40px' }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
            {q ? <><span style={{ color: '#111', fontWeight: 600 }}>"{q}"</span> 검색 결과 </> : '연재중 '}
            <span style={{ color: '#111', fontWeight: 700 }}>{filtered.length.toLocaleString()}</span>개 작품
          </div>
          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px 14px' }}>
              {filtered.map(w => <WorkCard key={w.id} work={w} onClick={() => setSelWork(w)} />)}
            </div>
          )}
        </div>
      </div>

      {selWork && <WorkSheet work={selWork} onClose={() => setSelWork(null)} />}
    </>
  )
}
