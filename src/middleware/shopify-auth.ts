import { Request, NextFunction, Response } from "express";

import { rateLimiter } from "../middleware/rate-limiter";

export const verifyRequest = async (req: Request, res: Response, next: NextFunction) => {
    const shopifyAccessToken = req.header('Authorization')
    const shop = req.header('Shop')

    

    if (!shop || !shopifyAccessToken) {
        return res.status(401).send('Unauthorized');
    }

    

    try {
        const response = await rateLimiter(`https://${shop}/admin/api/2024-04/shop.json`, {
            method:'GET',
            headers: {
                'X-Shopify-Access-Token': shopifyAccessToken
            }
        });
        if (response.status === 200) {
            return next();
        } else {
            const errorDetails = await response.text();
            
            return res.status(401).send('Unauthorized');
        }
    } catch (error) {
        
        return res.status(401).send('Unauthorized');
    }
}