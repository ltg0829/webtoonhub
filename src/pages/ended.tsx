gggimport { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { supabase, Work } from '@/lib/supabase'
import Header from '@/components/Header'
import { WorkCard, WorkSheet, LoadingSpinner, EmptyState, getPlatColor } from './index'

export default function EndedPage() {
  const [works, setWorks]       = useState<Work[]>([])
  const [loading, setLoading]   = useState(true)
  const [selWork, setSelWork]   = useState<Work | null>(null)
  const [q, setQ]               = useState('')
  const [selPlat, setSelPlat]   = useState('all')
  const [selGenre, setSelGenre] = useState('all')
  const [sortBy, setSortBy]     = useState<'title' | 'platform' | 'genre'>('title')

  useEffect(() => { fetchWorks() }, [])

  async function fetchWorks() {
    setLoading(true)
    try {
      const all: Work[] = []
      let from = 0
      let hasMore = true
      while (hasMore) {
        const { data, error } = await supabase
          .from('works').select('*').eq('is_ended', true).order('title').range(from, from + 999)
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

  const genres = useMemo(() => {
    const set = new Set(works.map(w => w.genre || '기타'))
    return ['all', ...Array.from(set).sort()]
  }, [works])

  const filtered = useMemo(() => {
    let list = works.filter(w => {
      if (selPlat !== 'all' && w.platform !== selPlat) return false
      if (selGenre !== 'all' && (w.genre || '기타') !== selGenre) return false
      if (q && !w.title.includes(q) && !w.platform.includes(q) && !(w.genre || '').includes(q)) return false
      return true
    })
    return [...list].sort((a, b) => {
      if (sortBy === 'platform') return a.platform.localeCompare(b.platform)
      if (sortBy === 'genre')    return (a.genre || '').localeCompare(b.genre || '')
      return a.title.localeCompare(b.title)
    })
  }, [works, selPlat, selGenre, q, sortBy])

  return (
    <>
      <Head><title>웹툰허브 — 완결 웹툰</title></Head>
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: '#f8f8f8', minHeight: '100vh' }}>

       {!loading && <Header q={q} setQ={setQ} />}

        <div style={{ background: '#fff', borderBottom: '1px solid #efefef', position: 'sticky', top: 60, zIndex: 90 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>

            {/* 연재 / 완결 탭 */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', scrollbarWidth: 'none' }}>
              <a href="/" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: 14, fontWeight: 400, color: '#888', borderBottom: '2.5px solid transparent', whiteSpace: 'nowrap', marginBottom: -1 }}>🟢 연재중</div>
              </a>
              <a href="/ended" style={{ textDecoration: 'none' }}>
                <div style={{ padding: '13px 20px', fontSize: 14, fontWeight: 700, color: '#555', borderBottom: '2.5px solid #555', whiteSpace: 'nowrap', marginBottom: -1 }}>✅ 완결</div>
              </a>
            </div>

            {/* 플랫폼 칩 + 정렬 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0 4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
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
          <div style={{ fontSize: 13, color: '#888', marginBottom: 14 }}>
            {q ? <><span style={{ color: '#111', fontWeight: 600 }}>"{q}"</span> 검색 결과 </> : '완결 '}
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
