'use client';

import { ArrowUp, LoaderCircle, Plus } from 'lucide-react';
import { useState } from 'react';

// 第二课把输入区升级成真实交互组件：
// 它开始维护本地输入值，并把提交动作交给页面层处理。
interface ChatInputProps {
  disabled?: boolean;
  onSend: (message: string) => Promise<void> | void;
}

export function ChatInput({ disabled = false, onSend }: ChatInputProps) {
  // `value` 对应文本框当前内容，是最基础的受控组件写法。
  const [value, setValue] = useState('');

  // 所有发送入口最终都会汇总到这里，避免按钮点击和回车提交各写一套逻辑。
  async function handleSubmit() {
    const next = value.trim();
    // 空文本和 loading 状态都不允许继续发送。
    if (!next || disabled) {
      return;
    }
    // 先清空输入框，给用户“消息已发出”的即时反馈。
    setValue('');
    await onSend(next);
  }

  return (
    <div className="chat-input-shell glass-panel">
      <div className="chat-input-body">
        <textarea
          // placeholder 会随着请求状态变化，帮助用户理解当前界面是否可交互。
          placeholder={disabled ? 'Agent 正在回复...' : '输入一个问题，验证核心对话流是否已经打通'}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            // 约定 Enter 发送、Shift+Enter 换行，是聊天产品的经典交互。
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />
      </div>

      <div className="chat-input-toolbar">
        <div className="chat-input-left">
          {/* 上传按钮仍是占位能力，但它的位置已经保留给后续多模态课程。 */}
          <button className="chat-input-icon-button" type="button" title="这里会在后续课程中接入多模态上传">
            <Plus className="h-5 w-5" />
          </button>
          <div className="chat-input-hint">当前阶段只实现文本对话，请求链路保持最小化。</div>
        </div>

        {/* 发送按钮与键盘提交共用同一处理函数，保持行为一致。 */}
        <button className="chat-input-send" type="button" onClick={() => void handleSubmit()} disabled={disabled}>
          {disabled ? <LoaderCircle className="h-5 w-5 animate-spin-slow" /> : <ArrowUp className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
