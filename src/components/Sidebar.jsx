import { Button, ListGroup } from 'react-bootstrap'
import { BsChat, BsPlus, BsTrash } from 'react-icons/bs'

const Sidebar = ({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onCloseSidebar,
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h5>Chat History</h5>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={onCloseSidebar}
          aria-label="Close chat history"
        >
          x
        </Button>
      </div>

      <Button variant="primary" className="new-chat-btn w-100 mb-3" onClick={onNewChat}>
        <BsPlus size={20} /> New Chat
      </Button>

      <ListGroup variant="flush" className="chat-list">
        {chats.length === 0 ? (
          <div className="text-center text-muted p-3">
            <BsChat size={30} />
            <p className="mt-2">No chats yet</p>
            <small>Start a new conversation</small>
          </div>
        ) : (
          chats.map((chat) => (
            <ListGroup.Item
              as="div"
              key={chat.id}
              action
              active={chat.id === currentChatId}
              onClick={() => onSelectChat(chat.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectChat(chat.id)
                }
              }}
              role="button"
              tabIndex={0}
              className="d-flex justify-content-between align-items-center"
            >
              <div className="chat-item-content">
                <div className="chat-title">{chat.title}</div>
                <small className="text-muted">
                  {new Date(chat.timestamp).toLocaleDateString()}
                </small>
              </div>
              <Button
                variant="link"
                size="sm"
                className="delete-chat-btn"
                onClick={(event) => {
                  event.stopPropagation()
                  onDeleteChat(chat.id)
                }}
                aria-label={`Delete chat ${chat.title}`}
              >
                <BsTrash color="#dc3545" />
              </Button>
            </ListGroup.Item>
          ))
        )}
      </ListGroup>
    </div>
  )
}

export default Sidebar
