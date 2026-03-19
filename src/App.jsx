import { useEffect, useRef, useState } from 'react'
import { Alert, Col, Container, Row } from 'react-bootstrap'
import ChatInput from './components/ChatInput'
import ChatMessage from './components/ChatMessage'
import Sidebar from './components/Sidebar'
import { sendMessage } from './config/gemini'
import './styles/App.css'

const STORAGE_KEY = 'gemini-chats'

const getChatTitle = (message) =>
  message.length > 30 ? `${message.slice(0, 30)}...` : message

const getTypingDelay = (character) => {
  if (!character) {
    return 12
  }

  if (character === '\n') {
    return 45
  }

  if ('.!?'.includes(character)) {
    return 35
  }

  if (',;:'.includes(character)) {
    return 22
  }

  return 12
}

function App() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const savedChats = localStorage.getItem(STORAGE_KEY)

    if (!savedChats) {
      return
    }

    try {
      const parsedChats = JSON.parse(savedChats)
      const hydratedChats = parsedChats.map((chat) => ({
        ...chat,
        messages: (chat.messages ?? [])
          .filter((message) => !(message.isPending && !message.text))
          .map((message) => ({
            ...message,
            isPending: false,
            isTyping: false,
          })),
      }))

      setChats(hydratedChats)

      if (hydratedChats.length > 0) {
        setCurrentChatId(hydratedChats[0].id)
        setMessages(hydratedChats[0].messages ?? [])
      }
    } catch (storageError) {
      console.error('Failed to parse saved chats:', storageError)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  }, [chats])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), [])

  const syncChatMessages = (chatId, nextMessages) => {
    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === chatId ? { ...chat, messages: nextMessages } : chat,
      ),
    )
  }

  const replaceMessage = (chatId, messageId, updater) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.id === messageId ? updater(message) : message,
      ),
    )

    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((message) =>
                message.id === messageId ? updater(message) : message,
              ),
            }
          : chat,
      ),
    )
  }

  const removeMessage = (chatId, messageId) => {
    setMessages((currentMessages) =>
      currentMessages.filter((message) => message.id !== messageId),
    )

    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.filter((message) => message.id !== messageId),
            }
          : chat,
      ),
    )
  }

  const typeAiResponse = (chatId, messageId, fullText) =>
    new Promise((resolve) => {
      clearTimeout(typingTimeoutRef.current)

      let index = 0
      const responseText = fullText.trim() ? fullText : 'No response received.'

      const step = () => {
        index = Math.min(responseText.length, index + (responseText[index] === '\n' ? 1 : 2))

        const nextText = responseText.slice(0, index)
        const isTyping = index < responseText.length

        replaceMessage(chatId, messageId, (message) => ({
          ...message,
          text: nextText,
          isPending: false,
          isTyping,
        }))

        if (!isTyping) {
          resolve()
          return
        }

        typingTimeoutRef.current = setTimeout(
          step,
          getTypingDelay(responseText[index - 1]),
        )
      }

      step()
    })

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date().toISOString(),
    }

    setChats((currentChats) => [newChat, ...currentChats])
    setCurrentChatId(newChat.id)
    setMessages([])
    setError(null)
    return newChat.id
  }

  const selectChat = (chatId) => {
    const selectedChat = chats.find((chat) => chat.id === chatId)

    if (!selectedChat) {
      return
    }

    setCurrentChatId(chatId)
    setMessages(selectedChat.messages ?? [])
    setError(null)
    setSidebarOpen((open) => (window.innerWidth < 768 ? false : open))
  }

  const deleteChat = (chatId) => {
    const updatedChats = chats.filter((chat) => chat.id !== chatId)
    setChats(updatedChats)

    if (currentChatId !== chatId) {
      return
    }

    if (updatedChats.length === 0) {
      setCurrentChatId(null)
      setMessages([])
      return
    }

    setCurrentChatId(updatedChats[0].id)
    setMessages(updatedChats[0].messages ?? [])
  }

  const handleSendMessage = async (message) => {
    if (!message.trim() || loading) {
      return
    }

    const activeChatId = currentChatId ?? createNewChat()
    const timestamp = new Date().toISOString()
    const userMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp,
    }
    const baseMessages = activeChatId === currentChatId ? [...messages, userMessage] : [userMessage]
    const pendingAiMessage = {
      id: (Date.now() + 1).toString(),
      text: '',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      isPending: true,
      isTyping: false,
    }
    const pendingMessages = [...baseMessages, pendingAiMessage]

    setCurrentChatId(activeChatId)
    setMessages(pendingMessages)
    setLoading(true)
    setError(null)

    setChats((currentChats) => {
      const existingChat = currentChats.find((chat) => chat.id === activeChatId)

      if (!existingChat) {
        return [
          {
            id: activeChatId,
            title: getChatTitle(message),
            messages: pendingMessages,
            timestamp,
          },
          ...currentChats,
        ]
      }

      return currentChats.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              title: chat.messages.length === 0 ? getChatTitle(message) : chat.title,
              messages: pendingMessages,
              timestamp,
            }
          : chat,
      )
    })

    try {
      const response = await sendMessage(message)
      await typeAiResponse(activeChatId, pendingAiMessage.id, response)
    } catch (requestError) {
      removeMessage(activeChatId, pendingAiMessage.id)
      syncChatMessages(activeChatId, baseMessages)
      setError(requestError.message)
      console.error('Error:', requestError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container fluid className="p-0 app-container">
      <Row className="g-0 h-100">
        {sidebarOpen && (
          <Col xs={12} md={3} lg={2} className="sidebar-col">
            <Sidebar
              chats={chats}
              currentChatId={currentChatId}
              onNewChat={createNewChat}
              onSelectChat={selectChat}
              onDeleteChat={deleteChat}
              onCloseSidebar={() => setSidebarOpen(false)}
            />
          </Col>
        )}

        <Col className="main-content-col">
          <div className="chat-container">
            {!sidebarOpen && (
              <button
                type="button"
                className="btn btn-primary open-sidebar-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open chat history"
              >
                &#9776;
              </button>
            )}

            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="welcome-message text-center">
                  <h1>Welcome to Gemini Chatbot</h1>
                  <p className="text-muted">Start a conversation with Google&apos;s Gemini AI</p>
                </div>
              ) : (
                messages.map((messageItem) => <ChatMessage key={messageItem.id} message={messageItem} />)
              )}

              {error && <Alert variant="danger" className="mx-3">{error}</Alert>}

              <div ref={messagesEndRef} />
            </div>

            <ChatInput onSendMessage={handleSendMessage} disabled={loading} />
          </div>
        </Col>
      </Row>
    </Container>
  )
}

export default App
