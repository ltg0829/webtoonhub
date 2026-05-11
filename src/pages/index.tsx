import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work, PLATFORM_COLORS, getGenreInfo } from '@/lib/supabase'

const DAYS = ['전체', '월', '화', '수', '목', '금', '토', '일']

function ss(n: number, t = 5) {
  return Array.from({ length: t }, (_, i) => i < Math.round(n) ? '★' : '☆').join('')
}

function getPlatColor(platform: string) {
  return PLATFORM_COLORS[platform] || '#7a7a8c'
}

function getPlatBadgeStyle(platform: string): React.CSSProperties {
  const colorMap: Record<string, { bg: string; color: string }> = {
    '네이버':     { bg: 'rgba(3,199,90,.15)',   color: '#03c75a' },
    '네이버웹툰': { bg: 'rgba(3,199,90,.15)',   color: '#03c75a' },
    '카카오페이지':{ bg: 'rgba(200,169,0,.15)', color: '#c8a900' },
    '카카오':     { bg: 'rgba(200,169,0,.15)',  color: '#c8a900' },
    '레진':       { bg: 'rgba(228,0,89,.12)',   color: '#e40059' },
    '레진코믹스': { bg: 'rgba(228,0,89,.12)',   color: '#e40059' },
    '리디':       { bg: 'rgba(31,140,230,.12)', color: '#1f8ce6' },
    '탑툰':       { bg: 'rgba(255,107,53,.12)', color: '#ff6b35' },
    '봄툰':       { bg: 'rgba(155,89,182,.12)', color: '#9b59b6' },
  }
  const c = colorMap[platform] || { bg: 'rgba(255,255,255,.08)', color: '#7a7a8c' }
  return { fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: c.bg, color: c.color }
}

export default function Home() {
  const [works, setWorks]       = useState<Work[]>([])
  const [loading, setLoading]   = useState(true)
  const [selWork, setSelWork]   = useState<Work | null>(null)
  const [q, setQ]               = useState('')
  const [selPlat, setSelPlat]   = useState('all')
  const [selDay, setSelDay]     = useState('전체')
  const [filterEnd, setFilterEnd] = useState(false)
  const [filterOn, setFilterOn]   = useState(false)

  useEffect(() => { fetchWorks() }, [])

  async function fetchWorks() {
    setLoading(true)
    const { data } = await supabase.from('works').select('*').order('title')
    if (data) setWorks(data as Work[])
    setLoading(false)
  }

  const platforms = useMemo(() => {
    const set = new Set(works.map(w => w.platform))
    return ['all', ...Array.from(set)]
  }, [works])

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

      {/* 헤더 */}
      <header style={{ background: '#16161f', borderBottom: '0.5px solid #2a2a3a', padding: '0 1.25rem', height: 52, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <span style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: '1.2rem', fontWeight: 700, color: '#f0ede6' }}>
          웹툰<span style={{ color: '#e8c84b' }}>허브</span>
        </span>
        <span style={{ fontSize: 11, color: '#7a7a8c', marginLeft: 10 }}>모든 플랫폼, 하나의 공간</span>
      </header>

      {/* 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#2a2a3a', borderBottom: '0.5px solid #2a2a3a' }}>
        {[
          [stats.platCount + '개', '연결 플랫폼'],
          [stats.workCount + '개', '수록 작품'],
          [stats.ongoingCount + '개', '연재중'],
        ].map(([n, l]) => (
          <div key={l} style={{ background: '#16161f', padding: '.65rem', textAlign: 'center' }}>
            <div style={{ fontSize: '.95rem', fontWeight: 600, color: '#e8c84b' }}>{n}</div>
            <div style={{ fontSize: 10, color: '#7a7a8c', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ padding: '.7rem 1rem', position: 'sticky', top: 52, zIndex: 90, background: 'rgba(12,12,16,.95)', backdropFilter: 'blur(12px)', borderBottom: '0.5px solid #2a2a3a' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <input
            placeholder="제목, 플랫폼, 장르 검색..."
            value={q} onChange={e => setQ(e.target.value)}
            style={{ flex: 1, background: '#1e1e2a', border: '0.5px solid #2a2a3a', borderRadius: 8, padding: '0 12px', height: 36, color: '#f0ede6', fontSize: 13, outline: 'none' }}
          />
          <button
            onClick={() => { setFilterEnd(!filterEnd); setFilterOn(false) }}
            style={{ fontSize: 12, padding: '5px 11px', borderRadius: 8, border: filterEnd ? '0.5px solid #e8c84b' : '0.5px solid #2a2a3a', background: filterEnd ? '#e8c84b' : 'transparent', color: filterEnd ? '#000' : '#7a7a8c', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: filterEnd ? 600 : 400 }}>
            완결
          </button>
          <button
            onClick={() => { setFilterOn(!filterOn); setFilterEnd(false) }}
            style={{ fontSize: 12, padding: '5px 11px', borderRadius: 8, border: filterOn ? '0.5px solid #e8c84b' : '0.5px solid #2a2a3a', background: filterOn ? '#e8c84b' : 'transparent', color: filterOn ? '#000' : '#7a7a8c', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: filterOn ? 600 : 400 }}>
            연재중
          </button>
        </div>
      </div>

      {/* 플랫폼 칩 */}
      <div style={{ padding: '.6rem 1rem', display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {platforms.map(p => {
          const active = selPlat === p
          const col = p === 'all' ? '#e8c84b' : getPlatColor(p)
          return (
            <button key={p} onClick={() => setSelPlat(p)}
              style={{ fontSize: 12, padding: '5px 11px', borderRadius: 20, border: `0.5px solid ${active ? col : '#2a2a3a'}`, background: active ? `${col}22` : 'transparent', color: active ? col : '#7a7a8c', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {p === 'all' ? '전체' : p}
            </button>
          )
        })}
      </div>

      {/* 요일 탭 */}
      <div style={{ padding: '.4rem 1rem', display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', borderBottom: '0.5px solid #2a2a3a' }}>
        {DAYS.map(d => {
          const active = selDay === d
          return (
            <button key={d} onClick={() => setSelDay(d)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: `0.5px solid ${active ? '#e8c84b' : '#2a2a3a'}`, background: active ? '#e8c84b' : 'transparent', color: active ? '#000' : '#7a7a8c', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: active ? 600 : 400 }}>
              {d === '전체' ? '전체' : d + '요일'}
            </button>
          )
        })}
      </div>

      {/* 결과 수 */}
      <div style={{ padding: '.5rem 1rem .4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#7a7a8c', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          {q ? `"${q}" 검색 결과` : selDay !== '전체' ? selDay + '요일 업데이트' : selPlat !== 'all' ? selPlat : '전체 작품'}
        </span>
        <span style={{ fontSize: 11, color: '#e8c84b', fontWeight: 600 }}>{filtered.length}개</span>
      </div>

      {/* 그리드 */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7a7a8c', fontSize: 13, lineHeight: 2 }}>
          {works.length === 0
            ? <>Supabase에 작품 데이터를 업로드해주세요<br /><span style={{ fontSize: 11, opacity: .6 }}>아래 가이드를 참고하세요</span></>
            : '검색된 작품이 없어요 😢'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, padding: '0 1rem 2rem' }}>
          {filtered.map(w => (
            <div key={w.id} onClick={() => setSelWork(w)}
              style={{ background: '#16161f', border: '0.5px solid #2a2a3a', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'transform .18s, border-color .18s' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e8c84b'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a3a'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', background: w.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.4rem', position: 'relative' }}>
                {w.emoji}
                {w.schedule && (
                  <div style={{ position: 'absolute', top: 7, left: 7, fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 600, background: 'rgba(232,200,75,.18)', color: '#e8c84b' }}>
                    {w.schedule}요일
                  </div>
                )}
                {w.is_ended && (
                  <div style={{ position: 'absolute', top: 7, right: 7, fontSize: 9, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,.12)', color: '#7a7a8c' }}>
                    완결
                  </div>
                )}
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3, marginBottom: 6, color: '#f0ede6' }}>{w.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#7a7a8c' }}>{(w.genre || '').split('·')[0] || '—'}</span>
                  <span style={getPlatBadgeStyle(w.platform)}>{w.platform}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 작품 상세 시트 */}
      {selWork && <WorkDetailSheet work={selWork} onClose={() => setSelWork(null)} />}
    </>
  )
}

function WorkDetailSheet({ work, onClose }: { work: Work; onClose: () => void }) {
  const platColor = getPlatColor(work.platform)

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div style={{ width: 36, height: 3, background: '#2a2a3a', borderRadius: 2, margin: '0 auto 1rem' }} />
        <button onClick={onClose} style={{ float: 'right', background: '#1e1e2a', border: '0.5px solid #2a2a3a', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#7a7a8c', fontSize: 12 }}>✕</button>

        {/* 작품 헤더 */}
        <div style={{ display: 'flex', gap: 14, marginBottom: '1.25rem', clear: 'both' }}>
          <div style={{ width: 72, height: 96, borderRadius: 10, background: work.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', flexShrink: 0 }}>
            {work.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Nanum Myeongjo',serif", fontSize: '1.15rem', fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>
              {work.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['플랫폼', work.platform],
                ['장르', work.genre || '—'],
                ['연재 요일', work.schedule ? work.schedule + '요일' : '—'],
                ['상태', work.is_ended ? '완결' : '연재중'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#7a7a8c', width: 52, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12, color: label === '상태' ? (work.is_ended ? '#7a7a8c' : '#2ecc71') : '#f0ede6' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '0.5px solid #2a2a3a', margin: '0 0 1rem' }} />

        {/* 플랫폼 바로가기 */}
        <div style={{ fontSize: 10, color: '#7a7a8c', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
          플랫폼 바로가기
        </div>
        {work.page_link ? (
          <a href={work.page_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: '0.5px solid #2a2a3a', background: '#1e1e2a', textDecoration: 'none', transition: 'border-color .18s' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = '#e8c84b')}
            onMouseOut={e => (e.currentTarget.style.borderColor = '#2a2a3a')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: platColor, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f0ede6' }}>{work.platform}에서 보기</div>
                <div style={{ fontSize: 11, color: '#7a7a8c', marginTop: 2 }}>
                  {work.page_link.replace(/^https?:\/\//, '').split('/')[0]}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#e8c84b', fontWeight: 600 }}>→</div>
          </a>
        ) : (
          <div style={{ fontSize: 12, color: '#7a7a8c', padding: '12px 0' }}>등록된 링크가 없습니다</div>
        )}
      </div>
    </div>
  )
}
