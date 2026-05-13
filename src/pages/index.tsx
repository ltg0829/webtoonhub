import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work, PLATFORM_COLORS } from '@/lib/supabase'

const DAYS = ['전체', '월', '화', '수', '목', '금', '토', '일']

export function getPlatColor(p: string) { return PLATFORM_COLORS[p] || '#888' }
export function getPlatIcon(p: string) {
  if (p.includes('네이버')) return 'N'
  if (p.includes('카카오')) return 'K'
  if (p.includes('레진')) return 'L'
  if (p.includes('리디')) return 'R'
  if (p.includes('탑툰')) return 'T'
  return p[0]
}

export default function Home() {
  const [works, setWorks]     = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [selWork, setSelWork] = useState<Work | null>(null)
  const [q, setQ]             = useState('')
  const [selPlat, setSelPlat] = useState('all')
  const [selDay, setSelDay]   = useState('전체')

  useEffect(() => { fetchWorks() }, [])

  async function fetchWorks() {
    setLoading(true)
    const all: Work[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('works').select('*')
        .eq('is_ended', false)
        .order('title')
        .range(from, from + 999)
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

  const filtered = useMemo(() => works.filter(w => {
    if (selPlat !== 'all' && w.platform !== selPlat) return false
    if (selDay !== '전체' && w.schedule !== selDay) return false
    if (q && !w.title.includes(q) && !w.platform.includes(q) && !(w.genre || '').includes(q)) return false
    return true
  }), [works, selPlat, selDay, q])

  return (
    <>
      <Head><title>웹툰허브 — 연재중 웹툰</title></Head>
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: '#f8f8f8', minHeight: '100vh' }}>

        {/* 헤더 */}
        <SiteHeader q={q} setQ={setQ} />

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

            {/* 플랫폼 칩 */}
            <div style={{ display: 'flex', gap: 6, padding: '8px 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
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
              {filtered.map(w => <WorkCard key={w.id} work={w} onClick={() => setSelWork(w)} />)}
            </div>
          )}
        </div>
      </div>

      {selWork && <WorkSheet work={selWork} onClose={() => setSelWork(null)} />}
    </>
  )
}

// ── 공통 컴포넌트 (ended.tsx에서도 import해서 사용) ──

export function SiteHeader({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 20 }}>
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#03c75a,#00a040)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff' }}>W</div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>
            웹툰<span style={{ color: '#03c75a' }}>허브</span>
          </span>
        </a>
        <div style={{ flex: 1, maxWidth: 500, position: 'relative' }}>
          <input placeholder="작품, 장르를 검색해 보세요" value={q} onChange={e => setQ(e.target.value)}
            style={{ width: '100%', height: 40, background: '#f4f4f4', border: '1.5px solid transparent', borderRadius: 20, padding: '0 44px 0 18px', fontSize: 14, color: '#111', outline: 'none', transition: 'border-color .15s', fontFamily: 'inherit' }}
            onFocus={e => (e.target.style.borderColor = '#03c75a')}
            onBlur={e => (e.target.style.borderColor = 'transparent')} />
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: 16, pointerEvents: 'none' }}>🔍</div>
        </div>
      </div>
    </header>
  )
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
        <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 5, background: platColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff' }}>
          {platIcon}
        </div>
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
              {([['플랫폼', work.platform], ['장르', work.genre || '—'], ['연재 요일', work.schedule ? work.schedule + '요일' : '—'], ['상태', work.is_ended ? '완결' : '연재중']] as [string,string][]).map(([k, v]) => (
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
