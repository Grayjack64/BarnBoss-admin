import { cookies } from 'next/headers'

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!

export function isAuthenticated(): boolean {
  const cookieStore = cookies()
  const authToken = cookieStore.get('admin-auth')
  return authToken?.value === 'authenticated'
}

export function authenticate(password: string): boolean {
  return password === ADMIN_PASSWORD
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