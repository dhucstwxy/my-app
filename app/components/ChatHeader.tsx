interface ChatHeaderProps {
  onSignOut: () => void;
}

export function ChatHeader({ onSignOut }: ChatHeaderProps) {
  return (
    <header className="chat-header">
      <div>
        <p className="lesson-kicker">Lesson 11</p>
        <h1 className="lesson-title">User Authentication</h1>
      </div>
      <div className="chat-header-actions">
        <div className="template-badge">Email + GitHub Auth</div>
        <button className="signout-button" type="button" onClick={onSignOut}>
          退出登录
        </button>
      </div>
    </header>
  );
}
