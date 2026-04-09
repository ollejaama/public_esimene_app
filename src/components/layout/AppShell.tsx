import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: React.ReactNode
  athleteName?: string
}

export function AppShell({ children, athleteName }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar athleteName={athleteName} />
      <main className="pl-52 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
