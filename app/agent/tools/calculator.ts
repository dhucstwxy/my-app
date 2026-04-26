export function runCalculator(expression: string) {
  try {
    const result = Function(`"use strict"; return (${expression})`)();
    return `计算结果: ${expression} = ${result}`;
  } catch {
    return `计算失败: ${expression}`;
  }
}
