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
    constructor();
    private initAgents;
    get(key: string): any;
    set(key: string, value: any): void;
    chat(input: string): Promise<{
        content: string;
    }>;
    private isDestructiveAction;
    private parseWithOpenAI;
    private parseWithRegex;
    private normalizePageName;
    private processAction;
    private writeBlocksToPage;
    private isRetryableError;
    private formatErrorMessage;
    private generateHelpfulResponse;
    private generateDebugInfo;
    private deleteBlock;
    private getPageContent;
    private getBlockContent;
    private findPageByName;
    private extractPageTitle;
    private calculateSimilarity;
    private writeToPage;
    private writeToSection;
    private getBlockText;
    private appendContentToPage;
    private createPage;
    private createPageInParent;
    private findBlocksWithContent;
    private updateBlock;
    private searchPages;
    private getAllPages;
    private findBestPageMatch;
    private createDatabaseEntry;
    private createEntryInPageDatabase;
    private extractDatabaseTitle;
    private parseAction;
    private createActionPlan;
}
export declare function createAgent(): Promise<NotionAgent>;
export {};
