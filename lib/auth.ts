import { supabase } from './supabase'

const DOMAIN = '@tuktuk.campaign'

export async function signIn(username: string, password: string) {
  const email = `${username}${DOMAIN}`
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}