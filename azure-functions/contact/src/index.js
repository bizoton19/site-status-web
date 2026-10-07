import { app } from '@azure/functions'
import { handleContactRequest } from './contactHandler.js'
import { storeInquiryTable } from './storeInquiry.js'

app.http('contact', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'contact',
  handler: async (request, context) => {
    const lengthHeader = request.headers.get('content-length')
    const contentLength = lengthHeader ? Number(lengthHeader) : undefined
    let body = {}
    try {
      body = await request.json()
    } catch {
      body = {}
    }

    const forwarded = request.headers.get('x-forwarded-for') || ''
    const result = await handleContactRequest({
      body,
      ip: forwarded.split(',')[0],
      env: process.env,
      fetchImpl: globalThis.fetch,
      store: (record) => storeInquiryTable(record, process.env),
      contentLength,
    })

    context.log('contact.result', result.status, result.body?.error || 'ok')

    return {
      status: result.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      jsonBody: result.body,
    }
  },
})
