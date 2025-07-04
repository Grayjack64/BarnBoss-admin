import { cookies } from 'next/headers'

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD?.trim() || ''

export function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const authToken = cookieStore.get('admin-auth')
  return authToken?.value === 'authenticated'
}

export function authenticate(password: string): boolean {
  const trimmedPassword = password.trim()
  const envPassword = ADMIN_PASSWORD
  
  // Log for debugging (remove in production)
  console.log('Auth Debug:', {
    hasEnvPassword: !!envPassword,
    envPasswordLength: envPassword.length,
    inputPasswordLength: trimmedPassword.length,
    passwordsMatch: trimmedPassword === envPassword
  })
  
  // Check if environment variable is set
  if (!envPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set or is empty')
    return false
  }
  
  return trimmedPassword === envPassword
}

export function setAuthCookie(): void {
  const cookieStore = cookies()
  cookieStore.set('admin-auth', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  })
}

export function clearAuthCookie(): void {
  const cookieStore = cookies()
  cookieStore.delete('admin-auth')
} 