'use client';

import { modelOptions } from '@/app/agent/config/models.config';

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
