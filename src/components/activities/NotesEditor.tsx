'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface NotesEditorProps {
  activityId: string
  initialNotes: string | null
}

export function NotesEditor({ activityId, initialNotes }: NotesEditorProps) {
  const [value, setValue] = useState(initialNotes ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const lastSaved = useRef(initialNotes ?? '')
  const router = useRouter()

  async function handleBlur() {
    if (value === lastSaved.current) return
    setStatus('saving')
    await fetch(`/api/activity/${activityId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: value }),
    })
    lastSaved.current = value
    setStatus('saved')
    router.refresh()
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes about this training session…"
        rows={3}
        className="w-full font-serif text-[13px] italic text-atlas-ink bg-transparent border border-atlas-rule px-3 py-2.5 resize-none focus:outline-none focus:border-atlas-muted placeholder:text-atlas-faint leading-relaxed"
      />
      {status !== 'idle' && (
        <span className="absolute bottom-3 right-3 font-mono text-[9px] tracking-[0.1em] uppercase text-atlas-faint pointer-events-none">
          {status === 'saving' ? 'saving…' : 'saved'}
        </span>
      )}
    </div>
  )
}
