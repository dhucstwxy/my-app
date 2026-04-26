import { ArrowUp, Plus } from 'lucide-react';

export function StaticChatInput() {
  return (
    <div className="chat-input-shell glass-panel">
      <div className="chat-input-body">
        <textarea
          placeholder="输入您的问题，开启 AI 之旅..."
          rows={1}
          readOnly
        />
      </div>

      <div className="chat-input-toolbar">
        <div className="chat-input-left">
          <button className="chat-input-icon-button" title="上传图片">
            <Plus className="h-5 w-5" />
          </button>

          <div className="chat-input-hint">
            第一课先保留输入区外观，第二课再接入真实消息发送。
          </div>
        </div>

        <button className="chat-input-send">
          <ArrowUp className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
