import { useState, useEffect } from 'react'
import Head from 'next/head'
import Papa from 'papaparse'
import { supabase, getGenreInfo } from '@/lib/supabase'
import Header from '@/components/Header'

export default function AdminPage() {
  const [isAdmin, setIsAdmin]     = useState(false)
  const [loading, setLoading]     = useState(true)
  const [works, setWorks]         = useState<any[]>([])
  const [preview, setPreview]     = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [toast, setToast]         = useState<{msg:string;ok:boolean}|null>(null)

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(!session?.user){ window.location.href='/'; return }
      const {data} = await supabase.from('profiles').select('is_admin').eq('id',session.user.id).single()
      if(!data?.is_admin){ window.location.href='/'; return }
      setIsAdmin(true); setLoading(false); fetchWorks()
    })
  },[])

  function showToast(msg:string, ok=true){
    setToast({msg,ok}); setTimeout(()=>setToast(null),3000)
  }

  async function fetchWorks(){
    const {data} = await supabase.from('works').select('*').order('id')
    if(data) setWorks(data)
  }

  function handleFile(file:File){
    Papa.parse(file,{
      header:true, skipEmptyLines:true,
      complete: result=>{
        const rows = (result.data as any[]).slice(1).filter(r=>r.Name?.trim())
        setPreview(rows)
        showToast(`${rows.length}개 작품 미리보기 완료`)
      },
      error: ()=>showToast('CSV 파싱 오류',false),
    })
  }

  async function uploadCSV(){
    if(!preview.length) return
    setUploading(true)
    try {
      const rows = preview.map(r=>{
        const genre = r.Genre?.trim()||null
        const g = getGenreInfo(genre)
        return {
          title:    r.Name?.trim(),
          platform: r.Platform?.trim(),
          schedule: r.Schedule?.trim()||null,
          genre,
          is_ended: r.End?.trim().toUpperCase()==='Y',
          page_link:r.PageLink?.trim()||null,
          emoji:    g.emoji,
          bg_color: g.bg,
          tags:     genre?[genre]:[],
        }
      })
      const {error} = await supabase.from('works').upsert(rows,{onConflict:'title,platform'})
      if(error) throw error
      showToast(`${rows.length}개 업로드 완료!`)
      setPreview([]); fetchWorks()
    } catch(e:any){
      showToast('오류: '+e.message, false)
    } finally { setUploading(false) }
  }

  async function deleteWork(id:number){
    if(!confirm('삭제하시겠습니까?')) return
    await supabase.from('works').delete().eq('id',id)
    fetchWorks(); showToast('삭제 완료')
  }

  if(loading) return <><Header/><div style={{padding:'3rem',textAlign:'center'}}><div className="spinner"/></div></>
  if(!isAdmin) return null

  const inp: React.CSSProperties = { width:'100%', marginBottom:8, padding:'0 11px', height:36, background:'#1e1e2a', border:'0.5px solid #2a2a3a', borderRadius:7, color:'#f0ede6', fontSize:13, outline:'none' }

  return (
    <>
      <Head><title>웹툰허브 — 관리자</title></Head>
      <Header/>

      {toast&&(
        <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',zIndex:9999}}>
          <div style={{background:'#16161f',border:`0.5px solid ${toast.ok?'#2ecc71':'#e24b4a'}`,borderRadius:10,padding:'12px 18px',fontSize:13,color:toast.ok?'#2ecc71':'#e24b4a',boxShadow:'0 4px 24px rgba(0,0,0,.4)'}}>
            {toast.msg}
          </div>
        </div>
      )}

      <div style={{maxWidth:860,margin:'0 auto',padding:'1.5rem 1rem'}}>
        <div style={{fontFamily:"'Nanum Myeongjo',serif",fontSize:'1.4rem',fontWeight:700,marginBottom:4}}>관리자 페이지</div>
        <div style={{fontSize:12,color:'#7a7a8c',marginBottom:'1.5rem'}}>총 {works.length}개 작품 등록됨</div>

        {/* CSV 업로드 */}
        <div style={{background:'#16161f',border:'0.5px dashed #2a2a3a',borderRadius:12,padding:'1.25rem',marginBottom:'1.5rem'}}>
          <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>📄 CSV 일괄 업로드</div>
          <div style={{fontSize:11,color:'#7a7a8c',marginBottom:12,lineHeight:1.7}}>
            컬럼: Index, Name, Platform, Schedule, Genre, End(Y/N), PageLink<br/>
            2번째 행(타입 정보)은 자동 스킵됩니다. 이미 있는 작품은 업데이트됩니다.
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <label style={{cursor:'pointer'}}>
              <span style={{fontSize:12,padding:'6px 14px',borderRadius:7,background:'#e8c84b',color:'#000',fontWeight:600,cursor:'pointer'}}>
                CSV 파일 선택
              </span>
              <input type="file" accept=".csv" style={{display:'none'}}
                onChange={e=>e.target.files?.[0]&&handleFile(e.target.files[0])}/>
            </label>
            {preview.length>0&&(
              <button onClick={uploadCSV} disabled={uploading}
                style={{fontSize:12,padding:'6px 14px',borderRadius:7,border:'0.5px solid #2ecc71',background:'transparent',color:'#2ecc71',cursor:'pointer'}}>
                {uploading?'업로드 중...':`${preview.length}개 업로드 확정`}
              </button>
            )}
          </div>

          {preview.length>0&&(
            <div style={{marginTop:12}}>
              <div style={{fontSize:11,color:'#7a7a8c',marginBottom:6}}>미리보기 (최대 5개)</div>
              <div style={{background:'#1e1e2a',borderRadius:8,overflow:'hidden'}}>
                {preview.slice(0,5).map((r,i)=>(
                  <div key={i} style={{padding:'8px 12px',borderBottom:'0.5px solid #2a2a3a',display:'flex',gap:8,fontSize:12,alignItems:'center'}}>
                    <span style={{color:'#f0ede6',fontWeight:500,flex:2}}>{r.Name}</span>
                    <span style={{color:'#7a7a8c',flex:1}}>{r.Platform}</span>
                    <span style={{color:'#7a7a8c',flex:1}}>{r.Genre}</span>
                    <span style={{color:r.End?.toUpperCase()==='Y'?'#7a7a8c':'#2ecc71'}}>
                      {r.End?.toUpperCase()==='Y'?'완결':'연재'}
                    </span>
                  </div>
                ))}
                {preview.length>5&&(
                  <div style={{padding:'6px 12px',fontSize:11,color:'#7a7a8c'}}>... 외 {preview.length-5}개</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 작품 목록 */}
        <div style={{fontSize:13,fontWeight:600,marginBottom:10}}>📚 등록된 작품 ({works.length}개)</div>
        <div style={{background:'#16161f',borderRadius:10,overflow:'hidden',border:'0.5px solid #2a2a3a'}}>
          <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:8,padding:'8px 14px',background:'#1e1e2a',fontSize:11,color:'#7a7a8c',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em'}}>
            <span>제목</span><span>플랫폼</span><span>장르</span><span>요일</span><span>관리</span>
          </div>
          {works.length===0?(
            <div style={{textAlign:'center',padding:'2.5rem',color:'#7a7a8c',fontSize:13}}>등록된 작품이 없습니다. CSV를 업로드해보세요.</div>
          ):works.map((w,i)=>(
            <div key={w.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:8,padding:'9px 14px',borderTop:'0.5px solid #2a2a3a',fontSize:12,alignItems:'center',background:i%2===0?'#16161f':'transparent'}}>
              <span style={{color:'#f0ede6',fontWeight:500}}>
                {w.emoji} {w.title}{' '}
                {w.is_ended&&<span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:'rgba(255,255,255,.1)',color:'#7a7a8c'}}>완결</span>}
              </span>
              <span style={{color:'#7a7a8c'}}>{w.platform}</span>
              <span style={{color:'#7a7a8c'}}>{w.genre||'—'}</span>
              <span style={{color:'#7a7a8c'}}>{w.schedule?w.schedule+'요일':'—'}</span>
              <button onClick={()=>deleteWork(w.id)}
                style={{fontSize:10,padding:'3px 8px',borderRadius:4,border:'0.5px solid #e24b4a',background:'transparent',color:'#e24b4a',cursor:'pointer'}}>
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
