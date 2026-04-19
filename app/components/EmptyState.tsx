import { Atom, Network } from 'lucide-react';

interface EmptyStateProps {
  onAction: (prompt: string) => void;
}

// 空状态从“课程介绍”升级为“可点击的引导入口”，
// 这样页面一加载就能直接触发示例提问。
export function EmptyState({ onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {/* 这套视觉骨架承接第一课，直观展示 UI 复用而能力逐课增强。 */}
      <div className="empty-state-orbit">
        <div className="empty-state-orbit-ring animate-spin-slow" />
        <div className="empty-state-orbit-ring inner animate-spin-reverse" />
        <div className="empty-state-core animate-pulse-glow" />
        <div className="empty-state-core-shadow" />
      </div>

      <h2 className="empty-state-title">
        <span className="text-white">接通</span>
        <span className="text-gradient"> 核心对话流 </span>
        <span className="text-white">闭环</span>
      </h2>

      <p className="empty-state-text">
        这一课开始把消息真正发到 API，再由 LangGraph Agent 返回回复。
        这一课先打通同步请求链路，后续课程再继续叠加流式输出、记忆与工具调用。
      </p>

      <div className="empty-state-grid">
        {/* 第一张卡把推荐提示词直接绑定到点击事件上，帮助验证链路是否打通。 */}
        <button className="feature-card feature-button" onClick={() => onAction('LangGraph 的最小聊天工作流是怎么跑起来的？')}>
          <div className="feature-card-icon blue">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <div className="feature-card-title">最小 LangGraph 工作流</div>
            <div className="feature-card-text">展示这一课如何把输入、Agent 和回复串起来。</div>
          </div>
        </button>

        {/* 第二张卡把视角切到“课程实现”和“源项目映射”的对应关系。 */}
        <button className="feature-card feature-button" onClick={() => onAction('这一课实现的页面，和完整项目首页之间是什么关系？')}>
          <div className="feature-card-icon cyan">
            <Atom className="h-5 w-5" />
          </div>
          <div>
            <div className="feature-card-title">源项目映射</div>
            <div className="feature-card-text">先保留源项目的视觉骨架，再逐步把能力迁移进来。</div>
          </div>
        </button>
      </div>
    </div>
  );
}
