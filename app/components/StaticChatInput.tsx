import { ArrowUp, Plus } from 'lucide-react';

// 这个组件故意命名为 `StaticChatInput`。
// 这里先关注“输入框长什么样”，暂时不处理“输入框怎么工作”。
export function StaticChatInput() {
  return (
    // 最外层容器负责承接玻璃态面板样式，营造真实聊天产品的输入区域质感。
    <div className="chat-input-shell glass-panel">
      <div className="chat-input-body">
        {/* 文本框设为只读。
            这样可以看到完整界面，同时不会误以为第一课已经具备发送能力。 */}
        <textarea
          placeholder="输入您的问题，开启 AI 之旅..."
          rows={1}
          readOnly
        />
      </div>

      {/* 工具栏延续真实产品常见布局：
          左边是附加能力入口，右边是发送按钮。 */}
      <div className="chat-input-toolbar">
        <div className="chat-input-left">
          <button className="chat-input-icon-button" title="上传图片">
            <Plus className="h-5 w-5" />
          </button>

          <div className="chat-input-hint">
            这一课先保留输入区外观，下一课再接入真实消息发送。
          </div>
        </div>

        {/* 发送按钮同样只保留形态，为下一课接入事件处理预留固定位置。 */}
        <button className="chat-input-send">
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
