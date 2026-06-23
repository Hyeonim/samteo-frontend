import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { chatApi } from '../../api/chatApi'
import { useAuth } from '../../context/AuthContext'
import './SamteoChatbot.css'

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: '안녕하세요. 삼터 도우미예요. 체류 유형, 일자리, 이벤트와 내 플래너 금액을 함께 살펴볼 수 있어요.',
}

const DEFAULT_SUGGESTIONS = [
  '내 플래너 요약해줘',
  '예상 잔액을 설명해줘',
  '단기와 장기의 차이는?',
]

function guestReply(message) {
  if (message.includes('단기') || message.includes('장기')) {
    return '단기는 짧은 지역 경험과 아르바이트에, 장기는 채용과 안정적인 정착 계획에 초점을 둡니다. 플래너 일자리 단계에서 두 유형을 바로 비교할 수 있어요.'
  }
  if (message.includes('일자리') || message.includes('알바')) {
    return '일자리 메뉴에서 공공 채용과 단기 알바를 살펴볼 수 있어요. 개인 플래너에 맞춘 답변은 로그인 후 이용할 수 있습니다.'
  }
  if (message.includes('이벤트') || message.includes('축제')) {
    return '이벤트 메뉴에서 지역별 축제와 행사를 확인할 수 있어요. 로그인하면 플래너의 빈 시간과 함께 살펴볼 수 있습니다.'
  }
  return '로그인하면 저장된 플래너의 급여·숙박비·예상 잔액을 바탕으로 더 정확히 안내해 드릴 수 있어요.'
}

export default function SamteoChatbot() {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MESSAGE])
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const dragRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(rawMessage) {
    const message = rawMessage.trim()
    if (!message || loading) return

    const userMessage = { role: 'user', content: message }
    const history = messages.slice(-8)
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    if (!isLoggedIn) {
      setMessages((prev) => [...prev, { role: 'assistant', content: guestReply(message) }])
      setSuggestions(['단기와 장기의 차이는?', '일자리는 어디서 찾아?', '로그인하기'])
      setLoading(false)
      return
    }

    try {
      const response = await chatApi.ask({ message, history, currentPath: location.pathname })
      const data = response?.data ?? response
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data?.message ?? '답변을 준비하지 못했어요. 잠시 후 다시 질문해 주세요.',
      }])
      if (data?.suggestions?.length) setSuggestions(data.suggestions)
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: '지금은 상담 서버와 연결되지 않았어요. 잠시 후 다시 시도해 주세요.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestion(suggestion) {
    if (suggestion === '로그인하기') {
      setOpen(false)
      navigate('/login')
      return
    }
    sendMessage(suggestion)
  }

  function submit(event) {
    event.preventDefault()
    sendMessage(input)
  }

  function startDrag(event) {
    if (window.innerWidth <= 600 || event.button !== 0 || event.target.closest('button')) return
    const panel = event.currentTarget.closest('.samteo-chat-panel')
    if (!panel) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: position,
      panelRect: panel.getBoundingClientRect(),
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    event.preventDefault()
  }

  function moveDrag(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const margin = 8
    const rawX = event.clientX - drag.startX
    const rawY = event.clientY - drag.startY
    const minX = margin - drag.panelRect.left
    const maxX = window.innerWidth - margin - drag.panelRect.right
    const minY = margin - drag.panelRect.top
    const maxY = window.innerHeight - margin - drag.panelRect.bottom
    const deltaX = Math.min(Math.max(rawX, minX), maxX)
    const deltaY = Math.min(Math.max(rawY, minY), maxY)
    setPosition({
      x: drag.startPosition.x + deltaX,
      y: drag.startPosition.y + deltaY,
    })
  }

  function endDrag(event) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div
      className={`samteo-chat${open ? ' open' : ''}${dragging ? ' dragging' : ''}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      {open && (
        <section className="samteo-chat-panel" role="dialog" aria-label="삼터 도우미" aria-modal="false">
          <header
            className="samteo-chat-head"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            title="드래그하여 이동"
          >
            <div className="samteo-chat-identity">
              <img src="/samteo-chatbot.png" alt="" />
              <div>
                <strong>삼터 도우미</strong>
                <span><i /> 상담 가능</span>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="챗봇 닫기">×</button>
          </header>

          <div className="samteo-chat-context">
            <span>읽기 전용</span>
            {isLoggedIn ? '최근 플래너를 기준으로 안내해요' : '로그인하면 플래너 맞춤 안내가 가능해요'}
          </div>

          <div className="samteo-chat-messages" ref={listRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`samteo-chat-message ${message.role}`} key={`${message.role}-${index}`}>
                {message.role === 'assistant' && <img src="/samteo-chatbot.png" alt="" />}
                <p>{message.content}</p>
              </div>
            ))}
            {loading && (
              <div className="samteo-chat-message assistant">
                <img src="/samteo-chatbot.png" alt="" />
                <div className="samteo-chat-typing" aria-label="답변 작성 중"><i /><i /><i /></div>
              </div>
            )}
          </div>

          <div className="samteo-chat-suggestions">
            {suggestions.map((suggestion) => (
              <button type="button" key={suggestion} onClick={() => handleSuggestion(suggestion)} disabled={loading}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="samteo-chat-form" onSubmit={submit}>
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="삼터에 대해 물어보세요"
              maxLength={1000}
              disabled={loading}
              aria-label="챗봇 질문"
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="질문 보내기">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m5 12 14-7-4.5 14-3-5.5L5 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="m11.5 13.5 3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </form>
          <small className="samteo-chat-notice">AI 답변은 참고용이며 중요한 정보는 공고 원문에서 확인해 주세요.</small>
        </section>
      )}

      <button
        type="button"
        className="samteo-chat-launcher"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? '삼터 도우미 닫기' : '삼터 도우미 열기'}
        aria-expanded={open}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 9 5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        ) : (
          <><img src="/samteo-chatbot.png" alt="" /><span>도움이 필요하신가요?</span></>
        )}
      </button>
    </div>
  )
}
