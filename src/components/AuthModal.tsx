import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = { onClose: () => void }

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const submit = async () => {
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onClose()
      } else {
        if (nickname.length < 2) throw new Error('닉네임은 2자 이상이어야 합니다')
        if (password.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다')
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { nickname } },
        })
        if (error) throw error
        setDone(true)
      }
    } catch (e: any) {
      setError(e.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {done ? (
          <>
            <div className="modal-title">이메일 확인 필요 ✉️</div>
            <p className="modal-sub">가입하신 이메일로 인증 링크를 보냈습니다.<br />메일함을 확인해주세요.</p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>확인</button>
          </>
        ) : (
          <>
            <div className="modal-title">웹툰허브 {mode === 'login' ? '로그인' : '회원가입'}</div>
            <p className="modal-sub">
              {mode === 'login' ? '리뷰·댓글 작성은 로그인이 필요합니다' : '닉네임과 이메일로 간편 가입'}
            </p>

            {mode === 'signup' && (
              <input className="input" style={{ marginBottom: 8 }}
                placeholder="닉네임 (2자 이상, 최대 12자)"
                maxLength={12} value={nickname}
                onChange={e => setNickname(e.target.value)} />
            )}
            <input className="input" style={{ marginBottom: 8 }}
              type="email" placeholder="이메일"
              value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" style={{ marginBottom: 8 }}
              type="password" placeholder={mode === 'login' ? '비밀번호' : '비밀번호 (6자 이상)'}
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />

            {error && <p style={{ fontSize: 11, color: 'var(--ng)', marginBottom: 8 }}>{error}</p>}

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }}
              onClick={submit} disabled={loading}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
            <button className="btn" style={{ width: '100%', marginBottom: 8 }}
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
              {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
            </button>
            <button className="btn" style={{ width: '100%' }} onClick={onClose}>취소</button>
          </>
        )}
      </div>
    </div>
  )
}
