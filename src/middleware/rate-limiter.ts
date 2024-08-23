import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
    minTime: 200, // 500ms delay between requests
    // maxConcurrent: 1 // Ensures only one request is processed at a time
});

const limitedFetch: (url: string, options?: RequestInit) => Promise<globalThis.Response> = limiter.wrap(
    (url: string, options?: RequestInit): Promise<globalThis.Response> => {
        return fetch(url, options);
    }
);

export const rateLimiter = async (url: string, options?: RequestInit, attempt: number = 1): Promise<globalThis.Response> => {
    const backoffFactor = 2;
    const maxAttempts = 5;
    try {

        let response = await limitedFetch(url, options);

        const callLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit') || '0/40';
        const retryAfterHeader = response.headers.get('Retry-After');

        const [currentCalls, maxCalls] = callLimitHeader.split('/').map(Number);
        console.log(`rate limiting : ${currentCalls}/${maxCalls}`);

        if (retryAfterHeader) {
            console.log("retryAfterHeader : ", retryAfterHeader)
            await new Promise((resolve) => setTimeout(resolve, parseFloat(retryAfterHeader) * 1000))

            return rateLimiter(url, options);
        } else if (currentCalls === 0) {
            await new Promise((resolve) => setTimeout(resolve, 2 * 1000))

            return rateLimiter(url, options);
        }

        return response;

    } catch (error) {
        console.error(`Fetch failed for ${attempt} URL: ${url} ${options.method}`, error);
        if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, backoffFactor * 1000)); // Exponential backoff
            return rateLimiter(url, options, attempt + 1); // Return the recursive call
        } else {
            throw new Error(`Failed after ${attempt} attempts`);
        }
    }
}