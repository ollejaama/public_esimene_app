import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './OnboardingForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Welcome — Atlas' }

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <main className="min-h-screen bg-atlas-bg flex items-center justify-center" style={{ padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-atlas-muted mb-8">
          Atlas
        </p>
        <OnboardingForm role={session.role} />
      </div>
    </main>
  )
}
