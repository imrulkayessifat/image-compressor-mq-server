import { Request, NextFunction, Response } from "express";

const rateLimiter = async (url: string, options?: RequestInit): Promise<globalThis.Response> => {
    let response = await fetch(url, options);

    const callLimitHeader = response.headers.get('X-Shopify-Shop-Api-Call-Limit') || '0/40';
    const retryAfterHeader = response.headers.get('Retry-After');

    const [currentCalls, maxCalls] = callLimitHeader.split('/').map(Number);
    console.log(`rate limiting : ${currentCalls}/${maxCalls}`);

    if (retryAfterHeader) {
        console.log("retryAfterHeader : ", retryAfterHeader)
        await new Promise((resolve) => setTimeout(resolve, parseFloat(retryAfterHeader) * 1000))

        return rateLimiter(url, options);
    }

    return response;
}

export const verifyRequest = async (req: Request, res: Response, next: NextFunction) => {
    const shopifyAccessToken = req.header('Authorization')
    const shop = req.header('Shop')

    console.log("verfiy request", shopifyAccessToken, shop)

    if (!shop || !shopifyAccessToken) {
        return res.status(401).send('Unauthorized');
    }

    console.log("shopify access token middleware :", shop, shopifyAccessToken)

    try {
        const response = await rateLimiter(`https://${shop}/admin/api/2024-04/shop.json`, {
            headers: {
                'X-Shopify-Access-Token': shopifyAccessToken
            }
        });
        if (response.status === 200) {
            return next();
        } else {
            const errorDetails = await response.text();
            console.log("error details : ", errorDetails)
            return res.status(401).send('Unauthorized');
        }
    } catch (error) {
        console.log("ppppp")
        return res.status(401).send('Unauthorized');
    }
}