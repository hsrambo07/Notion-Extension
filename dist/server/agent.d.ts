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
    constructor();
    get(key: string): any;
    set(key: string, value: any): void;
    chat(input: string): Promise<{
        content: string;
    }>;
    private isDestructiveAction;
    private parseWithOpenAI;
    private parseWithRegex;
    private parseAction;
    private extractPageCandidates;
    private createActionPlan;
    private processAction;
    private isRetryableError;
    private formatErrorMessage;
    private generateHelpfulResponse;
    private generateDebugInfo;
    private deleteBlock;
    private getPageContent;
    private getBlockContent;
    private findPageByName;
    private searchPages;
    private extractPageTitle;
    private findBestPageMatch;
    private writeToPage;
    private updateBlock;
    private findBlocksWithContent;
    private calculateSimilarity;
    private getAllPages;
    private createPage;
}
export declare function createAgent(): Promise<NotionAgent>;
export declare function processChat(input: string, confirm?: boolean): Promise<{
    response: string;
    requireConfirm: boolean;
}>;
export {};
