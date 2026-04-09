import { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { getSyncProgress } from '@/lib/sync/store'

export async function GET(req: NextRequest): Promise<Response> {
  const session = await getSessionFromRequest(req)
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { userId } = session

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
      }

      const interval = setInterval(() => {
        const progress = getSyncProgress(userId)
        send(progress)

        if (progress.status === 'complete' || progress.status === 'error') {
          clearInterval(interval)
          controller.close()
        }
      }, 500)

      // Clean up if client disconnects
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
