import Bottleneck from "bottleneck";

const limiter = new Bottleneck({
    minTime: 200,
    maxConcurrent: 1
});

const limitedFetch: (url: string, options?: RequestInit) => Promise<globalThis.Response> = limiter.wrap(
    (url: string, options?: RequestInit): Promise<globalThis.Response> => {
        return fetch(url, options);
    }
);

export const rateLimiter = async (url: string, options?: RequestInit, maxRetries = 5): Promise<Response> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await limitedFetch(url, options);

            // Check if the response is OK (status in the range 200-299)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const callLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit') || '0/40';
            const [currentCalls, maxCalls] = callLimitHeader.split('/').map(Number);

            console.log(`API Call Limit: ${currentCalls}/${maxCalls}`);

            return response;
        } catch (error: any) {
            if (error.response?.status === 429) {
                const retryAfter = parseInt(error.response.headers.get('Retry-After') || '5', 10);
                console.log(`Rate limited. Retrying after ${retryAfter} seconds. Attempt ${attempt + 1} of ${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            } else if (attempt === maxRetries - 1) {
                // If it's the last attempt, throw the error
                throw error;
            } else {
                console.log(`Error occurred: ${error.message}. Retrying... Attempt ${attempt + 1} of ${maxRetries}`);
                // Add a small delay before retrying to avoid hammering the server
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    throw new Error(`Failed after ${maxRetries} attempts`);
};