import { useState, useEffect } from 'react'
import { supabase, Work, Review, Comment, PLATFORM_COLORS } from '@/lib/supabase'

type Props = { work: Work; userId: string | null; nickname: string | null; onClose: () => void }

function ss(n: number, t = 5) {
  return Array.from({ length: t }, (_, i) => i < Math.round(n) ? '★' : '☆').join('')
}

export default function WorkSheet({ work, userId, nickname, onClose }: Props) {
  const [reviews, setReviews]   = useState<Review[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [tab, setTab]           = useState<'review' | 'comment'>('review')
  // 리뷰 작성
  const [stars, setStars]       = useState(0)
  const [hoverStar, setHoverStar] = useState(0)
  const [revText, setRevText]   = useState('')
  const [revLoading, setRevLoading] = useState(false)
  // 댓글 작성
  const [cmtText, setCmtText]   = useState('')
  const [cmtLoading, setCmtLoading] = useState(false)
  const [replyTo, setReplyTo]   = useState<number | null>(null)

  const platColor = PLATFORM_COLORS[work.platform] || 'var(--mut)'
  const avg = work.avg_stars ?? 0
  const myReview = reviews.find(r => r.user_id === userId)

  useEffect(() => { fetchReviews(); fetchComments() }, [work.id])

  async function fetchReviews() {
    const { data } = await supabase
      .from('reviews').select('*').eq('work_id', work.id).order('created_at', { ascending: false })
    if (data) {
      // 도움돼요 내가 투표했는지
      if (userId) {
        const { data: votes } = await supabase.from('helpful_votes').select('review_id').eq('user_id', userId)
        const votedIds = new Set((votes || []).map(v => v.review_id))
        setReviews(data.map(r => ({ ...r, voted: votedIds.has(r.id) })))
      } else {
        setReviews(data.map(r => ({ ...r, voted: false })))
      }
    }
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments').select('*').eq('work_id', work.id).order('created_at', { ascending: true })
    if (data) {
      const roots = data.filter(c => !c.parent_id)
      const nested = roots.map(r => ({ ...r, replies: data.filter(c => c.parent_id === r.id) }))
      setComments(nested)
    }
  }

  async function submitReview() {
    if (!userId || !nickname || stars === 0 || revText.trim().length < 2) return
    setRevLoading(true)
    await supabase.from('reviews').insert({ work_id: work.id, user_id: userId, nickname, stars, content: revText.trim() })
    setRevText(''); setStars(0); await fetchReviews()
    setRevLoading(false)
  }

  async function deleteReview(id: number) {
    await supabase.from('reviews').delete().eq('id', id)
    await fetchReviews()
  }

  async function voteHelpful(review: Review) {
    if (!userId) return
    if (review.voted) {
      await supabase.from('helpful_votes').delete().eq('review_id', review.id).eq('user_id', userId)
      await supabase.from('reviews').update({ helpful: review.helpful - 1 }).eq('id', review.id)
    } else {
      await supabase.from('helpful_votes').insert({ review_id: review.id, user_id: userId })
      await supabase.from('reviews').update({ helpful: review.helpful + 1 }).eq('id', review.id)
    }
    await fetchReviews()
  }

  async function submitComment(parentId: number | null = null) {
    if (!userId || !nickname || cmtText.trim().length < 2) return
    setCmtLoading(true)
    await supabase.from('comments').insert({ work_id: work.id, user_id: userId, nickname, content: cmtText.trim(), parent_id: parentId })
    setCmtText(''); setReplyTo(null); await fetchComments()
    setCmtLoading(false)
  }

  async function deleteComment(id: number) {
    await supabase.from('comments').delete().eq('id', id)
    await fetchComments()
  }

  const dist = [5,4,3,2,1].map(s => ({ s, c: reviews.filter(r => r.stars === s).length }))
  const maxC = Math.max(...dist.map(x => x.c), 1)

  return (
    <div className="sheet-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet-handle" />
        <button className="btn btn-sm" style={{ float: 'right', marginTop: -4 }} onClick={onClose}>✕</button>

        {/* 작품 헤더 */}
        <div style={{ display: 'flex', gap: 14, marginBottom: '1rem', clear: 'both' }}>
          <div style={{ width: 64, height: 86, borderRadius: 8, background: work.bg_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', flexShrink: 0 }}>
            {work.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: 3 }}>{work.title}</div>
            <div style={{ fontSize: 11, color: 'var(--mut)', marginBottom: 7 }}>
              {[work.platform, work.genre, work.schedule ? work.schedule + '요일' : null].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--acc)' }}>{avg > 0 ? avg.toFixed(1) : '—'}</span>
              <div>
                <div className="stars" style={{ fontSize: 15 }}>{avg > 0 ? ss(avg) : '☆☆☆☆☆'}</div>
                <div style={{ fontSize: 10, color: 'var(--mut)' }}>리뷰 {reviews.length}개</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(work.tags || []).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 7px', border: '0.5px solid var(--bdr)', borderRadius: 4, color: 'var(--mut)' }}>{t}</span>)}
              {work.is_ended && <span className="badge badge-end">완결</span>}
            </div>
          </div>
        </div>

        {/* 별점 분포 */}
        <div style={{ background: 'var(--sur2)', borderRadius: 9, padding: '11px 13px', marginBottom: 12 }}>
          <div className="sec-label">별점 분포</div>
          {dist.map(x => (
            <div key={x.s} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--mut)', width: 12, textAlign: 'right' }}>{x.s}</span>
              <div className="dist-bar-wrap"><div className="dist-bar" style={{ width: `${Math.round(x.c / maxC * 100)}%` }} /></div>
              <span style={{ fontSize: 10, color: 'var(--mut)', width: 16 }}>{x.c}</span>
            </div>
          ))}
        </div>

        {/* 플랫폼 링크 */}
        <div className="sec-label">플랫폼 바로가기</div>
        {work.page_link ? (
          <a href={work.page_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', borderRadius: 9, border: '0.5px solid var(--bdr)', background: 'var(--sur2)', textDecoration: 'none', marginBottom: 12, transition: 'border-color .18s' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--acc)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--bdr)')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: platColor, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--txt)' }}>{work.platform}</div>
                <div style={{ fontSize: 10, color: 'var(--mut)' }}>{work.page_link.replace(/^https?:\/\//, '').split('/')[0]}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: 'var(--mut)' }}>→</span>
          </a>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 12 }}>링크 없음</div>
        )}

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {(['review', 'comment'] as const).map(t => (
            <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : ''}`} onClick={() => setTab(t)}>
              {t === 'review' ? `리뷰 ${reviews.length}` : `댓글 ${comments.reduce((a,c) => a + 1 + (c.replies?.length || 0), 0)}`}
            </button>
          ))}
        </div>

        {/* 리뷰 탭 */}
        {tab === 'review' && (
          <>
            {/* 리뷰 작성 */}
            {userId ? (
              myReview ? (
                <div className="review-item" style={{ borderColor: 'rgba(232,200,75,.35)', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{myReview.nickname}</span>
                      <span className="badge badge-my">내 리뷰</span>
                    </div>
                    <span className="stars" style={{ fontSize: 11 }}>{ss(myReview.stars)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mut)' }}>{myReview.content}</div>
                  <button className="btn btn-sm btn-danger" style={{ marginTop: 7 }} onClick={() => deleteReview(myReview.id)}>삭제</button>
                </div>
              ) : (
                <div style={{ background: 'var(--sur2)', borderRadius: 9, padding: 12, marginBottom: 12, border: '0.5px solid var(--bdr)' }}>
                  <div className="sec-label">별점 선택 후 한줄평을 남겨보세요</div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 9 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ fontSize: 22, cursor: 'pointer', color: i <= (hoverStar || stars) ? 'var(--acc)' : 'var(--bdr)', lineHeight: 1, userSelect: 'none' }}
                        onClick={() => setStars(i)}
                        onMouseOver={() => setHoverStar(i)}
                        onMouseOut={() => setHoverStar(0)}>★</span>
                    ))}
                  </div>
                  <textarea className="textarea" rows={2} maxLength={80} placeholder="한줄평 입력 (최대 80자)"
                    value={revText} onChange={e => setRevText(e.target.value)} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
                    <span style={{ fontSize: 10, color: 'var(--mut)' }}>{revText.length} / 80</span>
                    <button className="btn btn-sm btn-primary" onClick={submitReview}
                      disabled={revLoading || stars === 0 || revText.trim().length < 2}>
                      {revLoading ? '등록 중...' : '등록'}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 13px', background: 'var(--sur2)', borderRadius: 9, border: '0.5px solid var(--bdr)', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--mut)' }}>리뷰를 작성하려면 로그인하세요</span>
                <a href="#" className="btn btn-sm btn-primary">로그인</a>
              </div>
            )}

            {/* 리뷰 목록 */}
            {reviews.length === 0 ? (
              <div className="empty">아직 리뷰가 없어요. 첫 번째 리뷰를 남겨보세요!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ background: 'var(--sur2)', borderRadius: 8, padding: '11px 12px', border: '0.5px solid var(--bdr)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: '#000' }}>
                          {r.nickname[0]}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>
                            {r.nickname} {r.user_id === userId && <span className="badge badge-my">내 리뷰</span>}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--mut)' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</div>
                        </div>
                      </div>
                      <span className="stars" style={{ fontSize: 11 }}>{ss(r.stars)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 5 }}>{r.content}</div>
                    <div style={{ marginTop: 7, display: 'flex', gap: 8 }}>
                      <button className={`btn btn-sm ${r.voted ? 'btn-primary' : ''}`}
                        onClick={() => voteHelpful(r)} disabled={!userId}>
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
        {tab === 'comment' && (
          <>
            {userId ? (
              <div style={{ background: 'var(--sur2)', borderRadius: 9, padding: 12, marginBottom: 12, border: '0.5px solid var(--bdr)' }}>
                <textarea className="textarea" rows={2} maxLength={300} placeholder="댓글 입력 (최대 300자)"
                  value={cmtText} onChange={e => setCmtText(e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 7 }}>
                  <button className="btn btn-sm btn-primary" onClick={() => submitComment(replyTo)}
                    disabled={cmtLoading || cmtText.trim().length < 2}>
                    {cmtLoading ? '등록 중...' : replyTo ? '답글 등록' : '댓글 등록'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '11px 13px', background: 'var(--sur2)', borderRadius: 9, border: '0.5px solid var(--bdr)', marginBottom: 12, fontSize: 12, color: 'var(--mut)' }}>
                댓글을 작성하려면 로그인하세요
              </div>
            )}

            {comments.length === 0 ? (
              <div className="empty">아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {comments.map(c => (
                  <div key={c.id}>
                    <div style={{ background: 'var(--sur2)', borderRadius: 8, padding: '10px 12px', border: '0.5px solid var(--bdr)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{c.nickname}</span>
                          <span style={{ fontSize: 10, color: 'var(--mut)' }}>{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {userId && <button className="btn btn-sm" onClick={() => setReplyTo(c.id)}>↩ 답글</button>}
                          {c.user_id === userId && <button className="btn btn-sm btn-danger" onClick={() => deleteComment(c.id)}>삭제</button>}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--mut)' }}>{c.content}</div>
                    </div>
                    {/* 대댓글 */}
                    {(c.replies || []).map(r => (
                      <div key={r.id} style={{ marginLeft: 20, marginTop: 6, background: 'var(--sur2)', borderRadius: 8, padding: '9px 12px', border: '0.5px solid var(--bdr)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: 'var(--acc)' }}>↩</span>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{r.nickname}</span>
                            <span style={{ fontSize: 10, color: 'var(--mut)' }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                          {r.user_id === userId && <button className="btn btn-sm btn-danger" onClick={() => deleteComment(r.id)}>삭제</button>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--mut)' }}>{r.content}</div>
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
