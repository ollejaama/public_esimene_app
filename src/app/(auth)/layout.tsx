export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-atlas-bg flex items-center justify-center px-4 py-16">
      {children}
    </main>
  )
}
