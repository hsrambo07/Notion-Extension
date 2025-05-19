// Simple in-memory rate limiter
const store = new Map();
export const rateLimit = (options) => {
    const { limit, window } = options;
    // Clean up expired entries every 5 minutes
    const cleanup = () => {
        const now = Date.now();
        for (const [key, value] of store.entries()) {
            if (now > value.reset) {
                store.delete(key);
            }
        }
    };
    setInterval(cleanup, 5 * 60 * 1000);
    return async (c, next) => {
        const ip = c.req.header('x-forwarded-for') || 'unknown';
        const now = Date.now();
        // Get or create rate limit data for this IP
        let data = store.get(ip);
        if (!data || now > data.reset) {
            data = { count: 0, reset: now + window };
            store.set(ip, data);
        }
        // Increment request count
        data.count++;
        // Set rate limit headers
        c.header('X-RateLimit-Limit', limit.toString());
        c.header('X-RateLimit-Remaining', Math.max(0, limit - data.count).toString());
        c.header('X-RateLimit-Reset', Math.floor(data.reset / 1000).toString());
        // Check if rate limit exceeded
        if (data.count > limit) {
            return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
        }
        await next();
    };
};
//# sourceMappingURL=rate-limit.js.map