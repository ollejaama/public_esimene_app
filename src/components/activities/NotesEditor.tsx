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
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</span>
        {status === 'saving' && <span className="text-xs text-gray-400">Saving…</span>}
        {status === 'saved' && <span className="text-xs text-green-500">Saved</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        placeholder="Add notes about this training session…"
        rows={4}
        className="w-full text-sm text-gray-800 border border-gray-200 rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-gray-400 placeholder:text-gray-300"
      />
    </div>
  )
}
