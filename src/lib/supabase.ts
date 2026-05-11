import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Work = {
  id: number
  title: string
  platform: string
  schedule: string | null
  genre: string | null
  is_ended: boolean
  page_link: string | null
  emoji: string
  bg_color: string
}

export const PLATFORM_COLORS: Record<string, string> = {
  '네이버': '#03c75a', '네이버웹툰': '#03c75a',
  '카카오페이지': '#c8a900', '카카오': '#c8a900',
  '레진': '#e40059', '레진코믹스': '#e40059',
  '리디': '#1f8ce6', '리디북스': '#1f8ce6',
  '탑툰': '#ff6b35', '봄툰': '#9b59b6',
}

export const GENRE_EMOJI: Record<string, { emoji: string; bg: string }> = {
  '판타지':   { emoji: '⚔️', bg: '#121a20' },
  '무협':     { emoji: '🗡️', bg: '#0f1a10' },
  '로맨스':   { emoji: '💌', bg: '#1a0d18' },
  '드라마':   { emoji: '🎭', bg: '#1a100d' },
  '개그':     { emoji: '😂', bg: '#1a1a08' },
  '스포츠':   { emoji: '⚽', bg: '#0a0f1a' },
  '액션':     { emoji: '💥', bg: '#1a0a0a' },
  '학원':     { emoji: '📚', bg: '#0a1018' },
  '로판':     { emoji: '👑', bg: '#1a0a20' },
  '힐링':     { emoji: '🌿', bg: '#0a1810' },
  '미스터리': { emoji: '🔍', bg: '#0d0d1a' },
}

export function getGenreInfo(genre: string | null) {
  if (!genre) return { emoji: '📖', bg: '#14141e' }
  const key = Object.keys(GENRE_EMOJI).find(k => genre.includes(k))
  return key ? GENRE_EMOJI[key] : { emoji: '📖', bg: '#14141e' }
}
