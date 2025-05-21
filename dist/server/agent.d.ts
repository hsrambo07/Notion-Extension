import { z } from 'zod';
declare const ChatRequest: z.ZodObject<{
    input: z.ZodString;
    confirm: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    input: string;
    confirm?: boolean | undefined;
}, {
    input: string;
    confirm?: boolean | undefined;
}>;
export type ChatRequestType = z.infer<typeof ChatRequest>;
export declare function validateChatRequest(data: unknown): Promise<ChatRequestType>;
export declare class NotionAgent {
    private state;
    private notionApiToken;
    private notionApiBaseUrl;
    private isTestEnvironment;
    private openAiApiKey;
    private formatAgent;
    private commandParser;
    private multiCommandHandler;
    private aiAgentNetwork;
    private contextAwareHandler;
    private openai;
    constructor();
    private initAgents;
    get(key: string): any;
    set(key: string, value: any): void;
    /**
     * Process a chat request
     */
    chat(input: string, options?: any): Promise<{
        content: string;
    }>;
    private isDestructiveAction;
    private parseAction;
    /**
     * Detect if the input contains multiple commands
     */
    private detectMultiCommand;
    /**
     * Detect if the input has section targeting
     */
    private detectSectionTargeting;
    /**
     * Extract the section target from a command
     */
    private extractSectionTarget;
    /**
     * Extract the target page name from a command
     */
    private extractPageTarget;
    private processAction;
    /**
     * Create and execute an action plan based on the parsed action
     */
    private createActionPlan;
    /**
     * Handle page creation action
     */
    private handleCreatePageAction;
    /**
     * Use LLM to convert format type and content to a proper Notion block
     */
    private getNotionBlockFromLLM;
    /**
     * Create a basic block as fallback
     */
    private createBasicBlock;
    /**
     * Handle file upload to Notion with improved error handling and retries
     */
    private uploadFileToNotion;
    /**
     * Create image block from uploaded file with improved error handling
     */
    private createImageBlockFromUpload;
    /**
     * Create file block from uploaded file
     */
    private createFileBlockFromUpload;
    /**
     * Update handleWriteAction to handle mixed content types
     */
    private handleWriteAction;
    /**
     * Find a page ID by page name
     */
    private findPageId;
    /**
     * Extract the title from a page object
     */
    private extractPageTitle;
    /**
     * Handle update actions (edit existing content)
     */
    private handleUpdateAction;
    /**
     * Handle delete actions (remove content)
     */
    private handleDeleteAction;
    /**
     * Find a subpage by parent ID and subpage name
     */
    private findSubpageId;
}
export declare function createAgent(): Promise<NotionAgent>;
export {};
