import { Sidebar } from './Sidebar'
import { getSession } from '@/lib/session'

interface AppShellProps {
  children: React.ReactNode
  athleteName?: string
}

export async function AppShell({ children, athleteName }: AppShellProps) {
  const session = await getSession()
  const role = session?.role ?? 'athlete'
  return (
    <div className="min-h-screen bg-white">
      <Sidebar athleteName={athleteName} role={role} />
      <main className="pl-52 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
