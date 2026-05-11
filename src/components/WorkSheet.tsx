import { useState, useEffect } from 'react'
import { supabase, Work, Review, Comment, PLATFORM_COLORS } from '@/lib/supabase'

type Props = { work: Work; userId: string|null; nickname: string|null; onClose: ()=>void }

function ss(n: number, t=5) {
  return Array.from({length:t},(_,i)=>i<Math.round(n)?'★':'☆').join('')
}

export default function WorkSheet({ work, userId, nickname, onClose }: Props) {
  const [reviews, setReviews]     = useState<Review[]>([])
  const [comments, setComments]   = useState<Comment[]>([])
  const [tab, setTab]             = useState<'review'|'comment'>('review')
  const [stars, setStars]         = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [revText, setRevText]     = useState('')
  const [revLoading, setRevLoading] = useState(false)
  const [cmtText, setCmtText]     = useState('')
  const [cmtLoading, setCmtLoading] = useState(false)

  const platColor = PLATFORM_COLORS[work.platform] || '#7a7a8c'
  const avg = work.avg_stars ?? 0
  const myReview = reviews.find(r => r.user_id === userId)
  const dist = [5,4,3,2,1].map(s=>({s, c:reviews.filter(r=>r.stars===s).length}))
  const maxC = Math.max(...dist.map(x=>x.c), 1)

  useEffect(() => { fetchReviews(); fetchComments() }, [work.id])

  async function fetchReviews() {
    const { data } = await supabase.from('reviews').select('*')
      .eq('work_id', work.id).order('created_at', {ascending:false})
    if (!data) return
    if (userId) {
      const { data: votes } = await supabase.from('helpful_votes').select('review_id').eq('user_id', userId)
      const votedIds = new Set((votes||[]).map((v:any)=>v.review_id))
      setReviews(data.map(r=>({...r, voted:votedIds.has(r.id)})))
    } else {
      setReviews(data.map(r=>({...r, voted:false})))
    }
  }

  async function fetchComments() {
    const { data } = await supabase.from('comments').select('*')
      .eq('work_id', work.id).order('created_at', {ascending:true})
    if (!data) return
    const roots = data.filter((c:any)=>!c.parent_id)
    setComments(roots.map((r:any)=>({...r, replies:data.filter((c:any)=>c.parent_id===r.id)})))
  }

  async function submitReview() {
    if (!userId||!nickname||stars===0||revText.trim().length<2) return
    setRevLoading(true)
    await supabase.from('reviews').insert({work_id:work.id, user_id:userId, nickname, stars, content:revText.trim()})
    setRevText(''); setStars(0); await fetchReviews()
    setRevLoading(false)
  }

  async function deleteReview(id: number) {
    await supabase.from('reviews').delete().eq('id', id)
    await fetchReviews()
  }

  async function voteHelpful(r: Review) {
    if (!userId) return
    if (r.voted) {
      await supabase.from('helpful_votes').delete().eq('review_id',r.id).eq('user_id',userId)
      await supabase.from('reviews').update({helpful:r.helpful-1}).eq('id',r.id)
    } else {
      await supabase.from('helpful_votes').insert({review_id:r.id, user_id:userId})
      await supabase.from('reviews').update({helpful:r.helpful+1}).eq('id',r.id)
    }
    await fetchReviews()
  }

  async function submitComment() {
    if (!userId||!nickname||cmtText.trim().length<2) return
    setCmtLoading(true)
    await supabase.from('comments').insert({work_id:work.id, user_id:userId, nickname, content:cmtText.trim(), parent_id:null})
    setCmtText(''); await fetchComments()
    setCmtLoading(false)
  }

  async function deleteComment(id: number) {
    await supabase.from('comments').delete().eq('id', id)
    await fetchComments()
  }

  const s: Record<string, React.CSSProperties> = {
    tag: { fontSize:10, padding:'2px 7px', border:'0.5px solid #2a2a3a', borderRadius:4, color:'#7a7a8c' },
    revBox: { background:'#1e1e2a', borderRadius:9, padding:12, marginBottom:12, border:'0.5px solid #2a2a3a' },
    revItem: { background:'#1e1e2a', borderRadius:8, padding:'11px 12px', border:'0.5px solid #2a2a3a' },
    btn: { fontSize:11, padding:'4px 10px', borderRadius:5, border:'0.5px solid #2a2a3a', background:'transparent', color:'#7a7a8c', cursor:'pointer' },
    btnAcc: { fontSize:11, padding:'4px 10px', borderRadius:5, border:'0.5px solid #e8c84b', background:'#e8c84b', color:'#000', fontWeight:600, cursor:'pointer' },
    btnDanger: { fontSize:10, padding:'3px 8px', borderRadius:4, border:'0.5px solid #e24b4a', background:'transparent', color:'#e24b4a', cursor:'pointer' },
    textarea: { width:'100%', background:'#16161f', border:'0.5px solid #2a2a3a', borderRadius:7, padding:'9px 11px', color:'#f0ede6', fontSize:13, outline:'none', resize:'none' as const, lineHeight:'1.6', display:'block' },
    nudge: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 13px', background:'#1e1e2a', borderRadius:9, border:'0.5px solid #2a2a3a', marginBottom:12 },
    tabBtn: (active: boolean): React.CSSProperties => ({ fontSize:12, padding:'5px 12px', borderRadius:6, border: active?'0.5px solid #e8c84b':'0.5px solid #2a2a3a', background: active?'#e8c84b':'transparent', color: active?'#000':'#7a7a8c', cursor:'pointer', fontWeight: active?600:400 }),
  }

  return (
    <div className="sheet-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="sheet">
        <div style={{ width:36, height:3, background:'#2a2a3a', borderRadius:2, margin:'0 auto 1rem' }}/>
        <button onClick={onClose} style={{ float:'right', background:'#1e1e2a', border:'0.5px solid #2a2a3a', borderRadius:'50%', width:28, height:28, cursor:'pointer', color:'#7a7a8c', fontSize:12 }}>✕</button>

        {/* 헤더 */}
        <div style={{ display:'flex', gap:14, marginBottom:'1rem', clear:'both' }}>
          <div style={{ width:64, height:86, borderRadius:8, background:work.bg_color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.9rem', flexShrink:0 }}>
            {work.emoji}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Nanum Myeongjo',serif", fontSize:'1.05rem', fontWeight:700, marginBottom:3 }}>{work.title}</div>
            <div style={{ fontSize:11, color:'#7a7a8c', marginBottom:7 }}>
              {[work.platform, work.genre, work.schedule?work.schedule+'요일':null].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:'1.2rem', fontWeight:700, color:'#e8c84b' }}>{avg>0?avg.toFixed(1):'—'}</span>
              <div>
                <div style={{ color:'#e8c84b', fontSize:14, letterSpacing:-1 }}>{avg>0?ss(avg):'☆☆☆☆☆'}</div>
                <div style={{ fontSize:10, color:'#7a7a8c' }}>리뷰 {reviews.length}개</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {(work.tags||[]).map(t=><span key={t} style={s.tag}>{t}</span>)}
              {work.is_ended&&<span style={{ fontSize:9, padding:'2px 6px', borderRadius:4, background:'rgba(255,255,255,.12)', color:'#7a7a8c' }}>완결</span>}
            </div>
          </div>
        </div>

        {/* 별점 분포 */}
        <div style={{ background:'#1e1e2a', borderRadius:9, padding:'11px 13px', marginBottom:12 }}>
          <div style={{ fontSize:10, color:'#7a7a8c', marginBottom:7, letterSpacing:'.06em', textTransform:'uppercase' }}>별점 분포</div>
          {dist.map(x=>(
            <div key={x.s} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
              <span style={{ fontSize:10, color:'#7a7a8c', width:12, textAlign:'right' }}>{x.s}</span>
              <div style={{ flex:1, height:4, background:'#2a2a3a', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', background:'#e8c84b', borderRadius:3, width:`${Math.round(x.c/maxC*100)}%`, transition:'width .4s' }}/>
              </div>
              <span style={{ fontSize:10, color:'#7a7a8c', width:16 }}>{x.c}</span>
            </div>
          ))}
        </div>

        {/* 플랫폼 링크 */}
        <div style={{ fontSize:10, color:'#7a7a8c', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:7 }}>플랫폼 바로가기</div>
        {work.page_link ? (
          <a href={work.page_link} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 13px', borderRadius:9, border:'0.5px solid #2a2a3a', background:'#1e1e2a', textDecoration:'none', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:platColor }}/>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#f0ede6' }}>{work.platform}</div>
                <div style={{ fontSize:10, color:'#7a7a8c' }}>{work.page_link.replace(/^https?:\/\//,'').split('/')[0]}</div>
              </div>
            </div>
            <span style={{ fontSize:12, color:'#7a7a8c' }}>→</span>
          </a>
        ) : (
          <div style={{ fontSize:12, color:'#7a7a8c', marginBottom:12 }}>링크 없음</div>
        )}

        {/* 탭 */}
        <div style={{ display:'flex', gap:6, marginBottom:12 }}>
          <button style={s.tabBtn(tab==='review')} onClick={()=>setTab('review')}>리뷰 {reviews.length}</button>
          <button style={s.tabBtn(tab==='comment')} onClick={()=>setTab('comment')}>댓글 {comments.reduce((a,c)=>a+1+(c.replies?.length||0),0)}</button>
        </div>

        {/* 리뷰 탭 */}
        {tab==='review'&&(
          <>
            {userId ? (
              myReview ? (
                <div style={{...s.revItem, borderColor:'rgba(232,200,75,.35)', marginBottom:12}}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:12, fontWeight:500 }}>{myReview.nickname}</span>
                      <span style={{ fontSize:9, padding:'2px 5px', background:'rgba(232,200,75,.12)', color:'#e8c84b', borderRadius:4, border:'0.5px solid rgba(232,200,75,.3)' }}>내 리뷰</span>
                    </div>
                    <span style={{ color:'#e8c84b', fontSize:11 }}>{ss(myReview.stars)}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#7a7a8c' }}>{myReview.content}</div>
                  <button style={{...s.btnDanger, marginTop:7}} onClick={()=>deleteReview(myReview.id)}>삭제</button>
                </div>
              ) : (
                <div style={s.revBox}>
                  <div style={{ fontSize:10, color:'#7a7a8c', marginBottom:9, letterSpacing:'.06em', textTransform:'uppercase' }}>별점 선택 후 한줄평을 남겨보세요</div>
                  <div style={{ display:'flex', gap:4, marginBottom:9 }}>
                    {[1,2,3,4,5].map(i=>(
                      <span key={i} onClick={()=>setStars(i)} onMouseOver={()=>setHoverStar(i)} onMouseOut={()=>setHoverStar(0)}
                        style={{ fontSize:22, cursor:'pointer', color:i<=(hoverStar||stars)?'#e8c84b':'#2a2a3a', lineHeight:1, userSelect:'none' }}>★</span>
                    ))}
                  </div>
                  <textarea style={s.textarea} rows={2} maxLength={80} placeholder="한줄평 입력 (최대 80자)"
                    value={revText} onChange={e=>setRevText(e.target.value)}/>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:7 }}>
                    <span style={{ fontSize:10, color:'#7a7a8c' }}>{revText.length} / 80</span>
                    <button style={s.btnAcc} onClick={submitReview}
                      disabled={revLoading||stars===0||revText.trim().length<2}>
                      {revLoading?'등록 중...':'등록'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div style={s.nudge}>
                <span style={{ fontSize:12, color:'#7a7a8c' }}>리뷰를 작성하려면 로그인하세요</span>
              </div>
            )}
            {reviews.length===0 ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'#7a7a8c', fontSize:13 }}>아직 리뷰가 없어요. 첫 번째 리뷰를 남겨보세요!</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {reviews.map((r,i)=>(
                  <div key={r.id} style={s.revItem}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:22, height:22, borderRadius:'50%', background:'#e8c84b', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#000' }}>{r.nickname[0]}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:500 }}>{r.nickname}</div>
                          <div style={{ fontSize:10, color:'#7a7a8c' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </div>
                      <span style={{ color:'#e8c84b', fontSize:11 }}>{ss(r.stars)}</span>
                    </div>
                    <div style={{ fontSize:12, color:'#7a7a8c', marginTop:5 }}>{r.content}</div>
                    <div style={{ marginTop:7 }}>
                      <button style={{...s.btn, ...(r.voted?{borderColor:'#e8c84b',color:'#e8c84b'}:{})}}
                        onClick={()=>voteHelpful(r)} disabled={!userId}>
                        도움돼요 {r.helpful}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 댓글 탭 */}
        {tab==='comment'&&(
          <>
            {userId ? (
              <div style={s.revBox}>
                <textarea style={s.textarea} rows={2} maxLength={300} placeholder="댓글 입력 (최대 300자)"
                  value={cmtText} onChange={e=>setCmtText(e.target.value)}/>
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:7 }}>
                  <button style={s.btnAcc} onClick={submitComment}
                    disabled={cmtLoading||cmtText.trim().length<2}>
                    {cmtLoading?'등록 중...':'댓글 등록'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={s.nudge}>
                <span style={{ fontSize:12, color:'#7a7a8c' }}>댓글을 작성하려면 로그인하세요</span>
              </div>
            )}
            {comments.length===0 ? (
              <div style={{ textAlign:'center', padding:'2rem', color:'#7a7a8c', fontSize:13 }}>아직 댓글이 없어요!</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {comments.map(c=>(
                  <div key={c.id}>
                    <div style={s.revItem}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontSize:12, fontWeight:500 }}>{c.nickname}</span>
                          <span style={{ fontSize:10, color:'#7a7a8c' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {c.user_id===userId&&<button style={s.btnDanger} onClick={()=>deleteComment(c.id)}>삭제</button>}
                      </div>
                      <div style={{ fontSize:12, color:'#7a7a8c' }}>{c.content}</div>
                    </div>
                    {(c.replies||[]).map(r=>(
                      <div key={r.id} style={{...s.revItem, marginLeft:20, marginTop:6}}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ fontSize:10, color:'#e8c84b' }}>↩</span>
                            <span style={{ fontSize:12, fontWeight:500 }}>{r.nickname}</span>
                            <span style={{ fontSize:10, color:'#7a7a8c' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          {r.user_id===userId&&<button style={s.btnDanger} onClick={()=>deleteComment(r.id)}>삭제</button>}
                        </div>
                        <div style={{ fontSize:12, color:'#7a7a8c' }}>{r.content}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
