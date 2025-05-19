import type { MiddlewareHandler } from 'hono';
interface RateLimitOptions {
    limit: number;
    window: number;
}
export declare const rateLimit: (options: RateLimitOptions) => MiddlewareHandler;
export {};
