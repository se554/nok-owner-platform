'use client'

import { useChat, Chat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { useRef, useEffect, useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'

interface ChatInterfaceProps {
  propertyId: string
  ownerName: string
  initialMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>
}

function toUIMessages(messages: ChatInterfaceProps['initialMessages']): UIMessage[] {
  return messages.map(m => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text' as const, text: m.content }],
    metadata: undefined,
  }))
}

const SUGGESTED_QUESTIONS = [
  '¿Cuánto gané este mes?',
  '¿Cuáles son los precios para Semana Santa?',
  '¿Cuándo fue la última limpieza?',
  '¿Qué reseñas tengo recientes?',
  '¿Qué fechas están disponibles en julio?',
  '¿Qué artículos del inventario necesito reponer?',
]

export default function ChatInterface({
  propertyId,
  ownerName,
  initialMessages,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')

  const chat = useMemo(() => new Chat({
    messages: toUIMessages(initialMessages),
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { propertyId },
    }),
  }), []) // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, sendMessage, status } = useChat({ chat })

  const isLoading = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  function handleSend(content: string) {
    if (!content.trim() || isLoading) return
    sendMessage({ text: content })
    setInputValue('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleSend(inputValue)
  }

  const showWelcome = messages.length === 0

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {showWelcome && (
          <div className="flex flex-col items-center justify-center py-12 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-4">
              <span className="text-white text-2xl">✦</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Hola, {ownerName.split(' ')[0]}
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              Soy tu asistente de NOK. Puedo responderte sobre ingresos, reservas,
              precios, reseñas, limpiezas e inventario de tu propiedad.
            </p>

            <div className="w-full grid grid-cols-1 gap-2">
              {SUGGESTED_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:bg-gray-50 text-sm text-gray-700 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <span className="text-white text-xs">✦</span>
              </div>
            )}

            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                message.role === 'user'
                  ? 'bg-black text-white rounded-br-sm'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown>
                    {message.parts
                      .filter(p => p.type === 'text')
                      .map(p => (p as { type: 'text'; text: string }).text)
                      .join('')}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>
                  {message.parts
                    .filter(p => p.type === 'text')
                    .map(p => (p as { type: 'text'; text: string }).text)
                    .join('')}
                </p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center shrink-0 mr-2 mt-0.5">
              <span className="text-white text-xs">✦</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Pregúntame algo sobre tu propiedad..."
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(inputValue)
              }
            }}
            className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition max-h-32 overflow-y-auto"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="shrink-0 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
