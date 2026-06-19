import { AppShell } from '@/components/layout/AppShell'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Coach — Atlas' }

export default async function CoachPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'coach') redirect('/home')

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted">
            Coach dashboard
          </p>
          <h1 className="font-serif text-[56px] tracking-[-0.03em] leading-[1.05] text-atlas-ink mt-1.5">
            My <em>athletes</em>
          </h1>
        </div>
      </div>

      <p className="font-serif italic text-[15px] text-atlas-muted">
        Coach dashboard coming soon — athlete linking and team management in the next session.
      </p>
    </AppShell>
  )
}
