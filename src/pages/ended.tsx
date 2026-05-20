import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work } from '@/lib/supabase'
import { SiteHeader, WorkCard, WorkSheet, LoadingSpinner, EmptyState, getPlatColor } from './index'

export default function EndedPage() {
  const [works, setWorks]     = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [selWork, setSelWork] = useState<Work | null>(null)
  const [q, setQ]             = useState('')
  const [selPlat, setSelPlat] = useState('all')
  const [selGenre, setSelGenre] = useState('all')

  useEffect(() => { fetchWorks() }, [])

  async function fetchWorks() {
    setLoading(true)
    const all: Work[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('works').select('*')
        .eq('is_ended', true)
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

  const genres = useMemo(() => {
    const set = new Set(works.map(w => w.genre || '기타'))
    return ['all', ...Array.from(set).sort()]
  }, [works])

  const filtered = useMemo(() => works.filter(w => {
    if (selPlat !== 'all' && w.platform !== selPlat) return false
    if (selGenre !== 'all' && (w.genre || '기타') !== selGenre) return false
    if (q && !w.title.includes(q) && !w.platform.includes(q) && !(w.genre || '').includes(q)) return false
    return true
  }), [works, selPlat, selGenre, q])

  return (
    <>
      <Head><title>웹툰허브 — 완결 웹툰</title></Head>
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: '#f8f8f8', minHeight: '100vh' }}>

        {/* 헤더 */}
        <SiteHeader q={q} setQ={setQ} />

        {/* 탭 + 필터 */}
        <div style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 60, zIndex: 90 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

            {/* 연재/완결 탭 */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <a href="/" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: 14, fontWeight: 400, color: '#888', borderBottom: '2.5px solid transparent', whiteSpace: 'nowrap', marginBottom: -1 }}>🟢 연재중</div>
              </a>
              <a href="/ended" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, color: '#555', borderBottom: '2.5px solid #555', whiteSpace: 'nowrap', marginBottom: -1 }}>✅ 완결</div>
              </a>
            </div>

            {/* 플랫폼 칩 */}
            <div style={{ display: 'flex', gap: 6, padding: '8px 0 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
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

            {/* 장르 칩 */}
            <div style={{ display: 'flex', gap: 5, padding: '4px 0 8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {genres.map(g => {
                const active = selGenre === g
                return (
                  <button key={g} onClick={() => setSelGenre(g)}
                    style={{ fontSize: 11, padding: '4px 11px', borderRadius: 20, border: `1.5px solid ${active ? '#555' : '#e8e8e8'}`, background: active ? '#555' : '#fff', color: active ? '#fff' : '#777', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontWeight: active ? 600 : 400, fontFamily: 'inherit', transition: 'all .15s' }}>
                    {g === 'all' ? '전체 장르' : g}
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
              {q ? <><span style={{ color: '#111', fontWeight: 600 }}>"{q}"</span> 검색 결과 </> : '완결 '}
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
