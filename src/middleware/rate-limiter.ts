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
        console.log("response status :", response.status)

        if (response.status === 429 || (currentCalls >= maxCalls && retryAfterHeader)) {
            console.log("retryAfter Header :", retryAfterHeader)

            const retryAfter = retryAfterHeader ? parseFloat(retryAfterHeader) : backoffFactor * attempt;
            await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
            return rateLimiter(url, options, attempt + 1);
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