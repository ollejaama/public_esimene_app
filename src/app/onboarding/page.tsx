import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createServiceClient } from '@/lib/supabase/server'
import { saveName } from './actions'

export const metadata = { title: 'Welcome — Atlas' }

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('user_profiles')
    .select('display_name, role')
    .eq('id', session.userId)
    .single()

  const currentName = profile?.display_name ?? ''
  const role = profile?.role ?? session.role
  const error = searchParams.error

  return (
    <div className="w-full max-w-sm">
      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-atlas-muted mb-8">
        Atlas · Step 1 of {role === 'coach' ? '1' : '3'}
      </p>

      <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-atlas-ink mb-1">
        What's your name?
      </h1>
      <p className="font-sans text-[13px] text-atlas-muted mb-8">
        This is how you'll appear in the app.
      </p>

      {error === 'name_required' && (
        <div className="border border-[#a23b2a] px-4 py-3 mb-6">
          <p className="font-mono text-[11px] text-[#a23b2a]">Please enter your name to continue.</p>
        </div>
      )}

      <form action={saveName} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="displayName"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-atlas-muted"
          >
            Full name
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            required
            autoComplete="name"
            defaultValue={currentName}
            autoFocus
            className="border border-atlas-rule bg-transparent font-sans text-[13px] text-atlas-ink px-3 py-2.5 outline-none focus:border-atlas-ink transition-colors"
          />
        </div>

        <button
          type="submit"
          className="w-full font-sans text-[13px] font-semibold tracking-[0.04em] px-4 py-3 mt-1 hover:opacity-85 transition-opacity"
          style={{ background: 'var(--atlas-accent)', color: '#fbf7ee' }}
        >
          Continue →
        </button>
      </form>
    </div>
  )
}
