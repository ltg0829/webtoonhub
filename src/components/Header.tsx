import { useState, useEffect } from 'react'
import { supabase, Profile } from '@/lib/supabase'
import AuthModal from './AuthModal'

export default function Header() {
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <>
      <header style={{
        background: 'var(--sur)', borderBottom: '0.5px solid var(--bdr)',
        padding: '0 1.25rem', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* 로고 */}
        <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: '1.2rem', fontWeight: 700, color: 'var(--txt)' }}>
            웹툰<span style={{ color: 'var(--acc)' }}>허브</span>
          </span>
        </a>

        {/* 네비 */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loading && (
            profile ? (
              <>
                <span style={{ fontSize: 12, color: 'var(--mut)' }}>
                  {profile.nickname}님
                </span>
                {profile.is_admin && (
                  <a href="/admin" className="btn btn-sm">관리자</a>
                )}
                <button className="btn btn-sm" onClick={logout}>로그아웃</button>
              </>
            ) : (
              <button className="btn btn-sm btn-primary" onClick={() => setShowAuth(true)}>
                로그인
              </button>
            )
          )}
        </nav>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
