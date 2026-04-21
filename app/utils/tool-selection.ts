export interface SelectableTool {
    id: string;
  }
  
  export function getDefaultSelectedToolIds(tools: SelectableTool[]) {
    return tools.map((tool) => tool.id);
  }
  
  export function toggleToolSelection(selectedToolIds: string[], toolId: string) {
    if (selectedToolIds.includes(toolId)) {
      return selectedToolIds.filter((id) => id !== toolId);
    }
  
    return [...selectedToolIds, toolId];
  }
  