import { Plus, User, Zap } from 'lucide-react';

// 侧边栏主体结构延续第一课，但这里把数据和展示彻底拆开，
// 为后续接入真实会话列表、选中态和用户状态做准备。
interface SessionItem {
  id: string;
  name: string;
}

interface SessionSidebarProps {
  sessions: SessionItem[];
  activeSessionId: string;
  footerPlan: string;
}

export function SessionSidebar({ sessions, activeSessionId, footerPlan }: SessionSidebarProps) {
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
        <button type="button">
          <Plus className="h-4 w-4 text-blue-400" />
          <span>新建对话</span>
        </button>
      </div>

      {/* 会话列表改为完全由 props 驱动，组件本身不再依赖内部硬编码数据。 */}
      <div className="sidebar-list scrollbar-hide">
        <div className="sidebar-list-title">历史记录</div>
        {sessions.map((session) => (
          <div key={session.id} className={`sidebar-session ${session.id === activeSessionId ? 'is-active' : ''}`}>
            <div className="sidebar-session-indicator" />
            <span className="sidebar-session-text">{session.name}</span>
          </div>
        ))}
      </div>

      {/* `footerPlan` 让同一套侧边栏在不同课程里复用时，只需要替换一处标签文案。 */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            <div className="sidebar-avatar-circle">
              <User className="h-5 w-5" />
            </div>
            <div className="sidebar-avatar-status" />
          </div>
          <div>
            <div className="sidebar-user-name">Dev User</div>
            <div className="sidebar-user-plan">{footerPlan}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
