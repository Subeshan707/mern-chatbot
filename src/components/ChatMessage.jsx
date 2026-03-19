import { Card } from 'react-bootstrap'
import ReactMarkdown from 'react-markdown'
import { BsPerson, BsRobot } from 'react-icons/bs'

const ChatMessage = ({ message }) => {
  const isUser = message.sender === 'user'

  return (
    <div className={`message-wrapper ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-icon">
        {isUser ? <BsPerson size={20} /> : <BsRobot size={20} />}
      </div>
      <Card className={`message-card ${isUser ? 'bg-primary text-white' : 'bg-light'}`}>
        <Card.Body>
          {isUser ? (
            <p className="mb-0">{message.text}</p>
          ) : message.isPending ? (
            <div className="typing-indicator" aria-label="AI is typing" aria-live="polite">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          ) : (
            <div className="typing-content">
              <ReactMarkdown>{message.text}</ReactMarkdown>
              {message.isTyping && <span className="typing-cursor" aria-hidden="true" />}
            </div>
          )}
          <small className={`message-time ${isUser ? 'text-white-50' : 'text-muted'}`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </small>
        </Card.Body>
      </Card>
    </div>
  )
}

export default ChatMessage
