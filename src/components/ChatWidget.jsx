import { useEffect, useRef, useState } from 'react'

const API_URL = import.meta.env.VITE_CHAT_API_URL

function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            text: 'Hello! I’m the Raaga Sudha assistant. How can I help you?',
        },
    ])
    const [isSending, setIsSending] = useState(false)

    const messagesEndRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth',
        })
    }, [messages, isSending])

    const getSessionId = () => {
        const key = 'raagasudha-chat-session'

        let sessionId = sessionStorage.getItem(key)

        if (!sessionId) {
            sessionId = `web-${crypto.randomUUID()}`
            sessionStorage.setItem(key, sessionId)
        }

        return sessionId
    }

    const sendMessage = async () => {
        const trimmed = message.trim()

        if (!trimmed || isSending) return

        setMessages((current) => [
            ...current,
            {
                role: 'user',
                text: trimmed,
            },
        ])

        setMessage('')
        setIsSending(true)

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: trimmed,
                    sessionId: getSessionId(),
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.error || 'Unable to contact the assistant.'
                )
            }

            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    text: data.answer,
                },
            ])
        } catch (error) {
            console.error('Chat request failed:', error)

            setMessages((current) => [
                ...current,
                {
                    role: 'assistant',
                    text:
                        'Sorry, I’m unable to respond right now. Please try again shortly.',
                },
            ])
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            sendMessage()
        }
    }

    return (
        <>
            {!isOpen && (
                <button
                    type="button"
                    className="chat-launcher"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open Raaga Sudha assistant"
                >
        <span className="chat-launcher-icon" aria-hidden="true">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
            </svg>
        </span>
                    <span>Ask Raaga Sudha</span>
                </button>
            )}

            {isOpen && (
                <section
                    className="chat-widget"
                    aria-label="Raaga Sudha assistant"
                >
                    <header className="chat-header">
                        <div>
                            <strong>Raaga Sudha Assistant</strong>
                            <span>Ask us anything</span>
                        </div>

                        <button
                            type="button"
                            className="chat-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            ×
                        </button>
                    </header>

                    <div className="chat-messages">
                        {messages.map((item, index) => (
                            <div
                                key={`${item.role}-${index}`}
                                className={`chat-message ${item.role}`}
                            >
                                {item.text}
                            </div>
                        ))}

                        {isSending && (
                            <div className="chat-message assistant chat-typing">
                                <span />
                                <span />
                                <span />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <textarea
                            value={message}
                            onChange={(event) =>
                                setMessage(event.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about classes, events, or Raaga Sudha..."
                            rows={1}
                            disabled={isSending}
                            aria-label="Message"
                        />

                        <button
                            type="button"
                            onClick={sendMessage}
                            disabled={!message.trim() || isSending}
                            aria-label="Send message"
                        >
                            ↑
                        </button>
                    </div>
                </section>
            )}
        </>
    )
}

export default ChatWidget