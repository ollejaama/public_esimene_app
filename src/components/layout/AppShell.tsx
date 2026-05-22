import { AtlasMasthead } from './AtlasMasthead'
import { Sidebar } from './Sidebar'
import { getSession } from '@/lib/session'

interface AppShellProps {
  children: React.ReactNode
  athleteName?: string
  viewingAthleteId?: string
  viewingAthleteName?: string
}

export async function AppShell({ children, athleteName, viewingAthleteId, viewingAthleteName }: AppShellProps) {
  const session = await getSession()
  const role = session?.role ?? 'athlete'
  return (
    <div className="min-h-screen bg-atlas-bg">
      <AtlasMasthead athleteName={athleteName} role={role} />
      <Sidebar role={role} viewingAthleteId={viewingAthleteId} viewingAthleteName={viewingAthleteName} />
      <main className="pl-48 pt-[53px] min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
