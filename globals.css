import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work, Profile, PLATFORM_COLORS, getGenreInfo } from '@/lib/supabase'
import Header from '@/components/Header'
import WorkSheet from '@/components/WorkSheet'

const DAYS = ['전체','월','화','수','목','금','토','일']

function ss(n: number, t = 5) {
  return Array.from({ length: t }, (_, i) => i < Math.round(n) ? '★' : '☆').join('')
}

function getPlatBadgeClass(platform: string) {
  const map: Record<string, string> = {
    '네이버': 'badge-naver', '네이버웹툰': 'badge-naver',
    '카카오페이지': 'badge-kakao', '카카오': 'badge-kakao',
    '레진': 'badge-lezhin', '레진코믹스': 'badge-lezhin',
    '리디': 'badge-ridi', '탑툰': 'badge-toptoon', '봄툰': 'badge-bomtoon',
  }
  return map[platform] || 'badge-other'
}

export default function Home() {
  const [works, setWorks]         = useState<Work[]>([])
  const [loading, setLoading]     = useState(true)
  const [selWork, setSelWork]     = useState<Work | null>(null)
  const [userId, setUserId]       = useState<string | null>(null)
  const [nickname, setNickname]   = useState<string | null>(null)

  // 필터 상태
  const [q, setQ]                 = useState('')
  const [selPlat, setSelPlat]     = useState('all')
  const [selDay, setSelDay]       = useState('전체')
  const [filterEnd, setFilterEnd] = useState(false)
  const [filterOn, setFilterOn]   = useState(false)

  // 플랫폼 목록 (동적)
  const platforms = useMemo(() => {
    const set = new Set(works.map(w => w.platform))
    return ['all', ...Array.from(set)]
  }, [works])

  useEffect(() => {
    fetchWorks()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        const { data } = await supabase.from('profiles').select('nickname').eq('id', user.id).single()
        setNickname(data?.nickname || null)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        setUserId(session.user.id)
        const { data } = await supabase.from('profiles').select('nickname').eq('id', session.user.id).single()
        setNickname(data?.nickname || null)
      } else {
        setUserId(null); setNickname(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchWorks() {
    setLoading(true)
    const { data } = await supabase.from('works_with_stats').select('*').order('id')
    if (data) setWorks(data as Work[])
    setLoading(false)
  }

  const filtered = useMemo(() => works.filter(w => {
    if (selPlat !== 'all' && w.platform !== selPlat) return false
    if (selDay !== '전체' && w.schedule !== selDay) return false
    if (filterEnd && !w.is_ended) return false
    if (filterOn && w.is_ended) return false
    if (q && !w.title.includes(q) && !w.platform.includes(q) && !(w.genre || '').includes(q)) return false
    return true
  }), [works, selPlat, selDay, filterEnd, filterOn, q])

  const stats = useMemo(() => ({
    platCount: new Set(works.map(w => w.platform)).size,
    workCount: works.length,
    ongoingCount: works.filter(w => !w.is_ended).length,
  }), [works])

  return (
    <>
      <Head><title>웹툰허브 — 모든 플랫폼 웹툰 탐색</title></Head>
      <Header />

      {/* 히어로 */}
      <div style={{ textAlign: 'center', padding: '1.75rem 1rem .75rem', position: 'relative' }}>
        <div style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: '1.9rem', fontWeight: 700 }}>
          웹툰<span style={{ color: 'var(--acc)' }}>허브</span>
        </div>
        <div style={{ fontSize: '.72rem', color: 'var(--mut)', letterSpacing: '.09em', textTransform: 'uppercase', marginBottom: '.75rem' }}>
          모든 플랫폼, 하나의 공간
        </div>

        {/* 통계 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--bdr)', borderTop: '0.5px solid var(--bdr)', borderBottom: '0.5px solid var(--bdr)', margin: '0 -1rem' }}>
          {[
            [stats.platCount + '개', '연결 플랫폼'],
            [stats.workCount + '개', '수록 작품'],
            [stats.ongoingCount + '개', '연재중'],
          ].map(([n, l]) => (
            <div key={l} style={{ background: 'var(--sur)', padding: '.65rem', textAlign: 'center' }}>
              <div style={{ fontSize: '.95rem', fontWeight: 600, color: 'var(--acc)' }}>{n}</div>
              <div style={{ fontSize: 10, color: 'var(--mut)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <div style={{ padding: '.7rem 1rem', position: 'sticky', top: 52, zIndex: 90, background: 'rgba(12,12,16,.95)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid var(--bdr)' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input className="input" placeholder="제목, 플랫폼, 장르 검색..."
            value={q} onChange={e => setQ(e.target.value)} style={{ flex: 1 }} />
          <button className={`btn btn-sm ${filterEnd ? 'btn-primary' : ''}`}
            onClick={() => { setFilterEnd(!filterEnd); setFilterOn(false) }}>완결</button>
          <button className={`btn btn-sm ${filterOn ? 'btn-primary' : ''}`}
            onClick={() => { setFilterOn(!filterOn); setFilterEnd(false) }}>연재중</button>
        </div>
      </div>

      {/* 플랫폼 칩 */}
      <div style={{ padding: '.65rem 1rem', display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {platforms.map(p => {
          const col = p === 'all' ? 'var(--acc)' : PLATFORM_COLORS[p] || 'var(--mut)'
          return (
            <button key={p} className={`btn btn-sm ${selPlat === p ? 'btn-primary' : ''}`}
              style={selPlat === p ? {} : { borderColor: col, color: col }}
              onClick={() => setSelPlat(p)}>
              {p === 'all' ? '전체' : p}
            </button>
          )
        })}
      </div>

      {/* 요일 탭 */}
      <div style={{ padding: '.4rem 1rem', display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '0.5px solid var(--bdr)' }}>
        {DAYS.map(d => (
          <button key={d} className={`btn btn-sm ${selDay === d ? 'btn-primary' : ''}`}
            onClick={() => setSelDay(d)}>
            {d === '전체' ? '전체' : d + '요일'}
          </button>
        ))}
      </div>

      {/* 결과 라벨 */}
      <div style={{ padding: '.5rem 1rem .4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--mut)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {q ? `"${q}" 검색 결과` : selDay !== '전체' ? selDay + '요일 업데이트' : selPlat !== 'all' ? selPlat : '전체 작품'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--acc)', fontWeight: 600 }}>{filtered.length}개</span>
      </div>

      {/* 그리드 */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty">검색된 작품이 없어요 😢</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, padding: '0 1rem 2rem' }}>
          {filtered.map(w => {
            const avg = w.avg_stars ?? 0
            const rc = w.review_count ?? 0
            return (
              <div key={w.id}
                style={{ background: 'var(--sur)', border: '0.5px solid var(--bdr)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'transform .18s, border-color .18s' }}
                onClick={() => setSelWork(w)}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--acc)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--bdr)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                <div style={{ width: '100%', aspectRatio: '3/4', background: w.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', position: 'relative', flexDirection: 'column' }}>
                  {w.emoji}
                  {w.schedule && <div style={{ position: 'absolute', top: 7, left: 7, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: 'rgba(232,200,75,.18)', color: 'var(--acc)' }}>{w.schedule}요일</div>}
                  {w.is_ended && <div style={{ position: 'absolute', top: 7, right: 7 }}><span className="badge badge-end">완결</span></div>}
                </div>
                <div style={{ padding: '8px 10px 10px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 4, color: 'var(--txt)' }}>{w.title}</div>
                  {avg > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 4 }}>
                      <span className="stars" style={{ fontSize: 10 }}>{ss(avg)}</span>
                      <span style={{ fontSize: 11, color: 'var(--acc)', fontWeight: 600 }}>{avg.toFixed(1)}</span>
                      <span style={{ fontSize: 10, color: 'var(--mut)' }}>({rc})</span>
                    </div>
                  ) : <div style={{ height: 14 }} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--mut)' }}>{(w.genre || '').split('·')[0]}</span>
                    <span className={`badge ${getPlatBadgeClass(w.platform)}`}>{w.platform}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 작품 상세 시트 */}
      {selWork && (
        <WorkSheet work={selWork} userId={userId} nickname={nickname}
          onClose={() => { setSelWork(null); fetchWorks() }} />
      )}
    </>
  )
}
