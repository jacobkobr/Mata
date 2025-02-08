import { NextResponse } from 'next/server'
import * as db from '@/lib/db-service.server'

export async function GET() {
  try {
    const chats = db.getAllChats()
    return NextResponse.json(chats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { action, ...params } = data

    switch (action) {
      case 'create':
        db.createChat(params.chat)
        return NextResponse.json({ success: true })

      case 'update':
        db.updateChat(params.chat)
        return NextResponse.json({ success: true })

      case 'delete':
        db.deleteChat(params.chatId)
        return NextResponse.json({ success: true })

      case 'getMessages':
        const messages = db.getChatMessages(params.chatId)
        return NextResponse.json(messages)

      case 'addMessage':
        db.addMessage(params.message)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
} 