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

// ── 로그인 모달 ──────────────────────────────────────
export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [pw, setPw]           = useState('')
  const [nick, setNick]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const inp: React.CSSProperties = {
    display: 'block', width: '100%', marginBottom: 10,
    height: 42, padding: '0 14px', borderRadius: 10,
    border: '1.5px solid #e8e8e8', background: '#fafafa',
    fontSize: 14, color: '#111', outline: 'none', fontFamily: 'inherit',
  }

  async function submit() {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
        if (error) throw error
        onClose()
      } else {
        if (nick.length < 2) throw new Error('닉네임은 2자 이상이어야 합니다')
        if (pw.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다')
        const { error } = await supabase.auth.signUp({ email, password: pw, options: { data: { nickname: nick } } })
        if (error) throw error
        setDone(true)
      }
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(4px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: 340, boxShadow: '0 8px 40px rgba(0,0,0,.15)', animation: 'modalIn .2s ease' }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>
        {done ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>이메일 확인 필요 ✉️</div>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>가입하신 이메일로 인증 링크를 보냈습니다. 메일함을 확인해주세요.</p>
            <button onClick={onClose} style={{ width: '100%', height: 44, borderRadius: 10, background: '#03c75a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>확인</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>웹툰허브 {mode === 'login' ? '로그인' : '회원가입'}</div>
            <p style={{ fontSize: 13, color: '#aaa', marginBottom: 20 }}>{mode === 'login' ? '즐겨찾기를 이용하려면 로그인하세요' : '닉네임과 이메일로 간편 가입'}</p>
            {mode === 'signup' && <input style={inp} placeholder="닉네임 (2자 이상)" maxLength={12} value={nick} onChange={e => setNick(e.target.value)} />}
            <input style={inp} type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={inp} type="password" placeholder={mode === 'login' ? '비밀번호' : '비밀번호 (6자 이상)'} value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
            {error && <p style={{ fontSize: 12, color: '#e24b4a', marginBottom: 10 }}>{error}</p>}
            <button onClick={submit} disabled={loading}
              style={{ width: '100%', height: 44, borderRadius: 10, background: '#03c75a', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10, opacity: loading ? .6 : 1 }}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              style={{ width: '100%', height: 38, borderRadius: 10, background: 'transparent', color: '#888', border: '1.5px solid #e8e8e8', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
              {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
            <button onClick={onClose} style={{ width: '100%', height: 36, borderRadius: 10, background: 'transparent', color: '#bbb', border: 'none', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>취소</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── 헤더 ────────────────────────────────────────────
export function SiteHeader({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  const [userId, setUserId]     = useState<string | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      setUserId(session.user.id)
      const { data } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
      setNickname(data?.nickname || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        const { data } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
        setNickname(data?.nickname || null)
      } else { setUserId(null); setNickname(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => { await supabase.auth.signOut() }

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#03c75a,#00a040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>W</div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>웹툰<span style={{ color: '#03c75a' }}>허브</span></span>
          </a>
          <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
            <input placeholder="작품, 장르를 검색해 보세요" value={q} onChange={e => setQ(e.target.value)}
              style={{ width: '100%', height: 40, background: '#f4f4f4', border: '1.5px solid transparent', borderRadius: 20, padding: '0 44px 0 18px', fontSize: 14, color: '#111', outline: 'none', transition: 'border-color .15s', fontFamily: 'inherit' }}
              onFocus={e => (e.target.style.borderColor = '#03c75a')}
              onBlur={e => (e.target.style.borderColor = 'transparent')} />
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', pointerEvents: 'none' }}>🔍</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {userId ? (
              <>
                <span style={{ fontSize: 13, color: '#555' }}>{nickname || ''}님</span>
                <button onClick={logout} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '1.5px solid #e8e8e8', background: '#fff', color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>로그아웃</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ fontSize: 13, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#03c75a', color: '#fff', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>로그인</button>
            )}
          </div>
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}

// ── 즐겨찾기 섹션 ────────────────────────────────────
function FavoriteSection({ userId, onWorkClick }: { userId: string; onWorkClick: (w: Work) => void }) {
  const [favWorks, setFavWorks] = useState<Work[]>([])

  useEffect(() => {
    supabase
      .from('favorites')
      .select('work_id, works(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setFavWorks(data.map((d: any) => d.works).filter(Boolean))
      })
  }, [userId])

  if (favWorks.length === 0) return null

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #efefef', padding: '14px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>⭐</span> 즐겨찾기
          <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}>{favWorks.length}개</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
          {favWorks.map(w => {
            const platColor = getPlatColor(w.platform)
            const platIcon  = getPlatIcon(w.platform)
            return (
              <div key={w.id} onClick={() => onWorkClick(w)}
                style={{ flexShrink: 0, width: 80, cursor: 'pointer' }}>
                <div style={{ width: 80, height: 107, borderRadius: 8, background: w.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', position: 'relative', marginBottom: 5, boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
                  {w.emoji}
                  <div style={{ position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 4, background: platColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#fff' }}>{platIcon}</div>
                  {w.schedule && !w.is_ended && (
                    <div style={{ position: 'absolute', bottom: 5, left: 5, fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: '#03c75a', color: '#fff' }}>{w.schedule}</div>
                  )}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#111', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{w.title}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── 워크카드 ────────────────────────────────────────
export function WorkCard({ work, onClick, userId, onFavChange }: { work: Work; onClick: () => void; userId?: string | null; onFavChange?: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [isFav, setIsFav]     = useState(false)
  const platColor = getPlatColor(work.platform)
  const platIcon  = getPlatIcon(work.platform)

  useEffect(() => {
    if (!userId) return
    supabase.from('favorites').select('id').eq('user_id', userId).eq('work_id', work.id).single()
      .then(({ data }) => setIsFav(!!data))
  }, [userId, work.id])

  async function toggleFav(e: React.MouseEvent) {
    e.stopPropagation()
    if (!userId) return
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('work_id', work.id)
      setIsFav(false)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, work_id: work.id })
      setIsFav(true)
    }
    onFavChange?.()
  }

  return (
    <div onClick={onClick} onMouseOver={() => setHovered(true)} onMouseOut={() => setHovered(false)}
      style={{ cursor: 'pointer', transition: 'transform .18s', transform: hovered ? 'translateY(-4px)' : 'none' }}>
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 8, boxShadow: hovered ? '0 8px 24px rgba(0,0,0,.15)' : '0 2px 8px rgba(0,0,0,.08)', transition: 'box-shadow .18s', aspectRatio: '3/4', background: work.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        {work.emoji}

        {/* 요일/완결 배지 */}
        {work.is_ended ? (
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: 'rgba(0,0,0,.55)', color: '#fff' }}>완결</div>
        ) : work.schedule ? (
          <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5, background: '#03c75a', color: '#fff' }}>{work.schedule}</div>
        ) : null}

        {/* 플랫폼 아이콘 */}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 5, background: platColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>{platIcon}</div>

        {/* 즐겨찾기 버튼 */}
        {userId && (
          <button onClick={toggleFav}
            style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: isFav ? '#ffcd00' : 'rgba(255,255,255,.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 2px 6px rgba(0,0,0,.15)', transition: 'all .15s' }}>
            {isFav ? '⭐' : '☆'}
          </button>
        )}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.35, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{work.title}</div>
      <div style={{ fontSize: 11, color: '#999' }}>{work.genre || '—'}</div>
    </div>
  )
}

// ── 워크시트 ────────────────────────────────────────
export function WorkSheet({ work, onClose, userId, onFavChange }: { work: Work; onClose: () => void; userId?: string | null; onFavChange?: () => void }) {
  const [isFav, setIsFav] = useState(false)
  const platColor = getPlatColor(work.platform)
  const platIcon  = getPlatIcon(work.platform)

  useEffect(() => {
    if (!userId) return
    supabase.from('favorites').select('id').eq('user_id', userId).eq('work_id', work.id).single()
      .then(({ data }) => setIsFav(!!data))
  }, [userId, work.id])

  async function toggleFav() {
    if (!userId) return
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('work_id', work.id)
      setIsFav(false)
    } else {
      await supabase.from('favorites').insert({ user_id: userId, work_id: work.id })
      setIsFav(true)
    }
    onFavChange?.()
  }

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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{work.title}</div>
              {userId && (
                <button onClick={toggleFav}
                  style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: isFav ? '#fff8e1' : '#f5f5f5', border: `2px solid ${isFav ? '#ffcd00' : '#e8e8e8'}`, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                  {isFav ? '⭐' : '☆'}
                </button>
              )}
            </div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 12, background: platColor, cursor: 'pointer' }}
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

// ── 공통 ────────────────────────────────────────────
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

// ── 메인 페이지 ──────────────────────────────────────
export default function Home() {
  const today = DAY_MAP[new Date().getDay()]

  const [works, setWorks]     = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [selWork, setSelWork] = useState<Work | null>(null)
  const [userId, setUserId]   = useState<string | null>(null)
  const [favKey, setFavKey]   = useState(0)
  const [q, setQ]             = useState('')
  const [selPlat, setSelPlat] = useState('all')
  const [selDay, setSelDay]   = useState(today)
  const [sortBy, setSortBy]   = useState<'title' | 'platform' | 'genre'>('title')

  useEffect(() => {
    fetchWorks()
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id || null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUserId(session?.user?.id || null))
    return () => subscription.unsubscribe()
  }, [])

  async function fetchWorks() {
    setLoading(true)
    const all: Work[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('works').select('*').eq('is_ended', false).order('title').range(from, from + 999)
      if (error || !data || data.length === 0) break
      all.push(...(data as Work[]))
      if (data.length < 1000) break
      from += 1000
    }
    setWorks(all)
    setLoading(false)
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
    list = [...list].sort((a, b) => {
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      if (sortBy === 'genre')    return (a.genre || '').localeCompare(b.genre || '')
      return a.title.localeCompare(b.title)
    })
    return list
  }, [works, selPlat, selDay, q, sortBy])

  return (
    <>
      <Head><title>웹툰허브 — 연재중 웹툰</title></Head>
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: '#f8f8f8', minHeight: '100vh' }}>

        <SiteHeader q={q} setQ={setQ} />

        {/* 즐겨찾기 섹션 (로그인 시 표시) */}
        {userId && <FavoriteSection key={favKey} userId={userId} onWorkClick={setSelWork} />}

        {/* 탭 + 필터 */}
        <div style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 60, zIndex: 90 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

            {/* 연재/완결 탭 + 요일 */}
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
              {/* 정렬 */}
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
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#888' }}>
              {q ? <><span style={{ color: '#111', fontWeight: 600 }}>"{q}"</span> 검색 결과 </> : '연재중 '}
              <span style={{ color: '#111', fontWeight: 700 }}>{filtered.length.toLocaleString()}</span>개 작품
            </div>
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '20px 14px' }}>
              {filtered.map(w => (
                <WorkCard key={w.id} work={w} onClick={() => setSelWork(w)} userId={userId} onFavChange={() => setFavKey(k => k + 1)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {selWork && <WorkSheet work={selWork} onClose={() => { setSelWork(null); setFavKey(k => k + 1) }} userId={userId} onFavChange={() => setFavKey(k => k + 1)} />}
    </>
  )
}
