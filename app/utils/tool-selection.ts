export function getDefaultSelectedToolIds(toolIds: { id: string }[]) {
  return toolIds.map((tool) => tool.id);
}

export function toggleToolSelection(current: string[], toolId: string) {
  return current.includes(toolId) ? current.filter((id) => id !== toolId) : [...current, toolId];
}
