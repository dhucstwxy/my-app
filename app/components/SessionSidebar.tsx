import { Plus, User, Zap } from 'lucide-react';
import type { ChatSession } from '@/app/types/chat';

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  footerName: string;
  footerPlan: string;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
}

export function SessionSidebar({ sessions, activeSessionId, footerName, footerPlan, onSelect, onNew }: SessionSidebarProps) {
  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="sidebar-logo-text">
          Chat Bot
          <span className="sidebar-logo-tag">AI</span>
        </span>
      </div>

      <div className="sidebar-action">
        <button type="button" onClick={onNew}>
          <Plus className="h-4 w-4 text-blue-400" />
          <span>新建对话</span>
        </button>
      </div>

      <div className="sidebar-list scrollbar-hide">
        <div className="sidebar-list-title">记忆会话</div>
        {sessions.length === 0 ? (
          <div className="sidebar-session-text">还没有历史对话</div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={`sidebar-session ${session.id === activeSessionId ? 'is-active' : ''}`}
              onClick={() => onSelect(session.id)}
            >
              <div className="sidebar-session-indicator" />
              <span className="sidebar-session-text">{session.title}</span>
            </button>
          ))
        )}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <div className="sidebar-avatar-circle">
              <User className="h-5 w-5" />
            </div>
            <div className="sidebar-avatar-status" />
          </div>
          <div>
            <div className="sidebar-user-name">{footerName}</div>
            <div className="sidebar-user-plan">{footerPlan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
