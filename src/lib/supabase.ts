import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yuerrwfwfscrujkidmyc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1ZXJyd2Z3ZnNjcnVqa2lkbXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzOTEzMjYsImV4cCI6MjA5Mzk2NzMyNn0.P2_rqPmgnV3YYN5NA1GG0PfaKahWJEcNVLbAzbzoEb4'

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
  '카카오페이지': '#ffcd00', '카카오': '#ffcd00',
  '레진': '#e40059', '레진코믹스': '#e40059',
  '리디': '#1f8ce6', '리디북스': '#1f8ce6',
  '탑툰': '#ff6b35', '봄툰': '#9b59b6',
}

export const GENRE_EMOJI: Record<string, { emoji: string; bg: string }> = {
  '판타지':   { emoji: '⚔️', bg: '#dce8f5' },
  '무협':     { emoji: '🗡️', bg: '#d5ecd5' },
  '로맨스':   { emoji: '💌', bg: '#fce4ec' },
  '드라마':   { emoji: '🎭', bg: '#fff3e0' },
  '개그':     { emoji: '😂', bg: '#fffde7' },
  '스포츠':   { emoji: '⚽', bg: '#e8f5e9' },
  '액션':     { emoji: '💥', bg: '#fce4e4' },
  '학원':     { emoji: '📚', bg: '#e3f2fd' },
  '로판':     { emoji: '👑', bg: '#f3e5f5' },
  '힐링':     { emoji: '🌿', bg: '#e8f5e9' },
  '미스터리': { emoji: '🔍', bg: '#ede7f6' },
  '공포':     { emoji: '👻', bg: '#e8eaf6' },
  '순정':     { emoji: '🌸', bg: '#fce4ec' },
  '일상':     { emoji: '☀️', bg: '#fffde7' },
  '스릴러':   { emoji: '🔪', bg: '#efebe9' },
}

export function getGenreInfo(genre: string | null) {
  if (!genre) return { emoji: '📖', bg: '#f0f0f0' }
  const key = Object.keys(GENRE_EMOJI).find(k => genre.includes(k))
  return key ? GENRE_EMOJI[key] : { emoji: '📖', bg: '#f0f0f0' }
}
