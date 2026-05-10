import { useState, useEffect } from 'react'
import Head from 'next/head'
import Papa from 'papaparse'
import { supabase, Profile, getGenreInfo } from '@/lib/supabase'
import Header from '@/components/Header'

type CsvRow = {
  Index: string; Name: string; Platform: string
  Schedule: string; Genre: string; End: string; PageLink: string
}

export default function AdminPage() {
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [works, setWorks]       = useState<any[]>([])
  const [toast, setToast]       = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [csvPreview, setCsvPreview] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { window.location.href = '/'; return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!data?.is_admin) { window.location.href = '/'; return }
      setProfile(data)
      setLoading(false)
      fetchWorks()
    })
  }, [])

  async function fetchWorks() {
    const { data } = await supabase.from('works').select('*').order('id')
    if (data) setWorks(data)
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // CSV 파싱 + 미리보기
  function handleCsvFile(file: File) {
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: result => {
        const rows = result.data as any[]
        // 2번째 행(타입 정보) 제거
        const data = rows.slice(1).filter(r => r.Name?.trim())
        setCsvPreview(data)
        showToast(`${data.length}개 작품 미리보기 준비됨`, 'ok')
      },
      error: () => showToast('CSV 파싱 오류', 'err'),
    })
  }

  // Supabase에 업서트
  async function uploadCsv() {
    if (!csvPreview.length) return
    setUploading(true)
    try {
      const rows = csvPreview.map(r => {
        const genre = r.Genre?.trim() || null
        const gInfo = getGenreInfo(genre)
        return {
          title:     r.Name?.trim(),
          platform:  r.Platform?.trim(),
          schedule:  r.Schedule?.trim() || null,
          genre,
          is_ended:  r.End?.trim().toUpperCase() === 'Y',
          page_link: r.PageLink?.trim() || null,
          emoji:     gInfo.emoji,
          bg_color:  gInfo.bg,
          tags:      genre ? [genre] : [],
        }
      })
      const { error } = await supabase.from('works').upsert(rows, { onConflict: 'title,platform' })
      if (error) throw error
      showToast(`${rows.length}개 작품 업로드 완료!`, 'ok')
      setCsvPreview([])
      fetchWorks()
    } catch (e: any) {
      showToast('업로드 오류: ' + e.message, 'err')
    } finally {
      setUploading(false)
    }
  }

  async function deleteWork(id: number) {
    if (!confirm('이 작품을 삭제하시겠습니까?')) return
    await supabase.from('works').delete().eq('id', id)
    fetchWorks()
    showToast('삭제 완료', 'ok')
  }

  if (loading) return <><Header /><div style={{ padding: '3rem', textAlign: 'center' }}><div className="spinner" /></div></>
  if (!profile?.is_admin) return null

  return (
    <>
      <Head><title>웹툰허브 — 관리자</title></Head>
      <Header />

      {/* 토스트 */}
      {toast && (
        <div className="toast-wrap">
          <div className={`toast ${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>
          관리자 페이지
        </div>
        <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: '1.5rem' }}>
          {profile.nickname}님 · 총 {works.length}개 작품 등록됨
        </div>

        {/* CSV 업로드 */}
        <div style={{ background: 'var(--sur)', border: '0.5px dashed var(--bdr)', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>📄 CSV 일괄 업로드</div>
          <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 12, lineHeight: 1.7 }}>
            컬럼: Index, Name, Platform, Schedule, Genre, End(Y/N), PageLink<br />
            2번째 행(타입 정보)은 자동으로 스킵됩니다. 이미 있는 작품은 업데이트됩니다.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ cursor: 'pointer' }}>
              <span className="btn btn-sm btn-primary">CSV 파일 선택</span>
              <input type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleCsvFile(e.target.files[0])} />
            </label>
            {csvPreview.length > 0 && (
              <button className="btn btn-sm" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}
                onClick={uploadCsv} disabled={uploading}>
                {uploading ? '업로드 중...' : `${csvPreview.length}개 업로드 확정`}
              </button>
            )}
          </div>

          {/* 미리보기 */}
          {csvPreview.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 6 }}>미리보기 (최대 5개)</div>
              <div style={{ background: 'var(--sur2)', borderRadius: 8, overflow: 'hidden' }}>
                {csvPreview.slice(0, 5).map((r, i) => (
                  <div key={i} style={{ padding: '8px 12px', borderBottom: '0.5px solid var(--bdr)', display: 'flex', gap: 8, fontSize: 12, alignItems: 'center' }}>
                    <span style={{ color: 'var(--txt)', fontWeight: 500, flex: 2 }}>{r.Name}</span>
                    <span style={{ color: 'var(--mut)', flex: 1 }}>{r.Platform}</span>
                    <span style={{ color: 'var(--mut)', flex: 1 }}>{r.Genre}</span>
                    <span style={{ color: r.End?.toUpperCase() === 'Y' ? 'var(--mut)' : 'var(--ok)', flex: 0 }}>
                      {r.End?.toUpperCase() === 'Y' ? '완결' : '연재'}
                    </span>
                  </div>
                ))}
                {csvPreview.length > 5 && (
                  <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--mut)' }}>... 외 {csvPreview.length - 5}개</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 작품 목록 */}
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📚 등록된 작품 ({works.length}개)</div>
        <div style={{ background: 'var(--sur)', borderRadius: 10, overflow: 'hidden', border: '0.5px solid var(--bdr)' }}>
          {/* 헤더 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, padding: '8px 14px', background: 'var(--sur2)', fontSize: 11, color: 'var(--mut)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
            <span>제목</span><span>플랫폼</span><span>장르</span><span>요일</span><span>관리</span>
          </div>
          {works.map((w, i) => (
            <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, padding: '9px 14px', borderTop: '0.5px solid var(--bdr)', fontSize: 12, alignItems: 'center', background: i % 2 === 0 ? 'var(--sur)' : 'transparent' }}>
              <span style={{ color: 'var(--txt)', fontWeight: 500 }}>{w.emoji} {w.title} {w.is_ended && <span className="badge badge-end">완결</span>}</span>
              <span style={{ color: 'var(--mut)' }}>{w.platform}</span>
              <span style={{ color: 'var(--mut)' }}>{w.genre || '—'}</span>
              <span style={{ color: 'var(--mut)' }}>{w.schedule ? w.schedule + '요일' : '—'}</span>
              <button className="btn btn-sm btn-danger" onClick={() => deleteWork(w.id)}>삭제</button>
            </div>
          ))}
          {works.length === 0 && (
            <div className="empty">등록된 작품이 없습니다. CSV를 업로드해보세요.</div>
          )}
        </div>
      </div>
    </>
  )
}
