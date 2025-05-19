/**
 * Utility functions
 */
/**
 * Filter tools based on enabledTools parameter
 */
export function filterTools(tools, enabledToolsSet = new Set()) {
    if (enabledToolsSet.size === 0)
        return tools;
    return tools.filter((tool) => enabledToolsSet.has(tool.name));
}
