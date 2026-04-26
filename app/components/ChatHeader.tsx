interface ChatHeaderProps {
  onSignOut: () => void;
}

export function ChatHeader({ onSignOut }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <p className="lesson-kicker">Lesson 15</p>
        <h1 className="lesson-title">Custom Rendering</h1>
      </div>
      <div className="chat-header-actions">
        <div className="template-badge">Render + Interact</div>
        <button className="signout-button" type="button" onClick={onSignOut}>
          退出登录
        </button>
      </div>
    </header>
  );
}
