import { useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { BsSend } from 'react-icons/bs'

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit(event)
    }
  }

  return (
    <div className="chat-input-container">
      <Form onSubmit={handleSubmit}>
        <InputGroup>
          <Form.Control
            as="textarea"
            rows={1}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={disabled}
            className="chat-input"
          />
          <Button type="submit" variant="primary" disabled={!message.trim() || disabled}>
            <BsSend />
          </Button>
        </InputGroup>
      </Form>
    </div>
  )
}

export default ChatInput
