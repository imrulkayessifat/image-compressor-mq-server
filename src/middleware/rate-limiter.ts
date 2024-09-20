import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
    minTime: 200, // 500ms delay between requests
    maxConcurrent: 1 // Ensures only one request is processed at a time
});

const limitedFetch: (url: string, options?: RequestInit) => Promise<globalThis.Response> = limiter.wrap(
    (url: string, options?: RequestInit): Promise<globalThis.Response> => {
        return fetch(url, options);
    }
);

export const rateLimiter = async (url: string, options?: RequestInit, attempt: number = 1): Promise<Response> => {
    const maxAttempts = 5;
    const baseDelay = 1000; // 1 second

    try {
        let response = await limitedFetch(url, options);
        const callLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit') || '0/40';
        const retryAfterHeader = response.headers.get('Retry-After');
        const [currentCalls, maxCalls] = callLimitHeader.split('/').map(Number);

        console.log(`Attempt ${attempt} - URL: ${url}`);
        console.log(`Response status: ${response.status}`);
        console.log(`Call Limit: ${callLimitHeader}`);

        if (response.status === 429 || currentCalls >= maxCalls) {
            if (attempt >= maxAttempts) {
                throw new Error(`Failed after ${attempt} attempts`);
            }

            const retryAfter = retryAfterHeader ? parseFloat(retryAfterHeader) : 1;
            const delay = Math.max(retryAfter * 1000, baseDelay * Math.pow(2, attempt - 1));

            console.log(`Rate limited. Retrying after ${delay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return rateLimiter(url, options, attempt + 1);
        }

        return response;
    } catch (error:any) {
        console.error(`Error on attempt ${attempt}:`, error);
        if (attempt < maxAttempts) {
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Retrying after ${delay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return rateLimiter(url, options, attempt + 1);
        } else {
            throw new Error(`Failed after ${attempt} attempts: ${error.message}`);
        }
    }
};