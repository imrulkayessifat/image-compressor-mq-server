import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const db = new PrismaClient();

interface AccessTokenType {
    access_token: string;
    scope: string;
}

export const subscribeData = async (req: Request, res: Response): Promise<void> => {
    const charge = {
        recurring_application_charge: {
            name: req.body.plan,
            price: req.body.price,
            return_url: `${process.env.FRONTEND_DOMAIN}/plans`,
            test: true
        }
    }

    const accessTokenResponse = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'client_id': `${process.env.SHOPIFY_CLIENT_ID}`,
            'client_secret': `${process.env.SHOPIFY_CLIENT_SECRET}`,
            'grant_type': 'client_credentials'
        })
    })

    const accessToken = await accessTokenResponse.json() as AccessTokenType;

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/recurring_application_charges.json`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': `${accessToken.access_token}`
        },
        body: JSON.stringify(charge)
    })
    const url = await response.json()
    res.status(201).json({ data: url });
}

export const getSingleChargeData = async (req: Request, res: Response): Promise<void> => {
    console.log(req.body)
    const chargeId = req.body.chargeId

    const accessTokenResponse = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'client_id': `${process.env.SHOPIFY_CLIENT_ID}`,
            'client_secret': `${process.env.SHOPIFY_CLIENT_SECRET}`,
            'grant_type': 'client_credentials'
        })
    })

    const accessToken = await accessTokenResponse.json() as AccessTokenType;

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/recurring_application_charges/${chargeId}.json`, {
        headers: {
            'X-Shopify-Access-Token': `${accessToken.access_token}`
        },
    })

    const data = await response.json() as any;

    const charge_id = `${data.recurring_application_charge.id}`;
    if (data.recurring_application_charge.status === 'active') {
        await db.store.update({
            where: {
                name: req.body.storeName
            },
            data: {
                plan: data.recurring_application_charge.name,
                chargeId: charge_id
            }
        })
    }

}