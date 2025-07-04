import { redirect } from 'next/navigation'
import { isAuthenticated } from '../lib/auth'
import Dashboard from '../components/Dashboard'

export default function Home() {
  if (!isAuthenticated()) {
    redirect('/login')
  }

  return <Dashboard />
} 