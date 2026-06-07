import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work, PLATFORM_COLORS } from '@/lib/supabase'
import Header from '@/components/Header'

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

        <Header q={q} setQ={setQ} />

        <div style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 60, zIndex: 90 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
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

// 이 함수가 있어야 Next.js가 정적 페이지로 처리하지 않음
export async function getServerSideProps() {
  return { props: {} }
}
