import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Check if password was provided
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (authenticate(password)) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('admin-auth', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      })
      return response
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
} 