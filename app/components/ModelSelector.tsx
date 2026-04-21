'use client';

import { modelOptions } from '@/app/agent/config/models.config';

// 模型选择器是第九课新增的前端入口，用来打通“用户选择 -> 请求参数 -> Agent”链路。
interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <label className="model-selector">
      <span>模型</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {modelOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
