import type { Express } from 'express';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { getStripePublishableKey, getUncachableStripeClient } from './stripeClient';
import { isAuthenticated } from './auth';

export function registerStripeRoutes(app: Express) {
  app.get('/api/stripe/publishable-key', async (_req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stripe/products', async (_req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.products WHERE active = true ORDER BY name`
      );
      res.json({ data: result.rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stripe/products-with-prices', async (_req, res) => {
    try {
      const result = await db.execute(
        sql`
          SELECT 
            p.id as product_id,
            p.name as product_name,
            p.description as product_description,
            p.active as product_active,
            p.metadata as product_metadata,
            pr.id as price_id,
            pr.unit_amount,
            pr.currency,
            pr.recurring,
            pr.active as price_active
          FROM stripe.products p
          LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
          WHERE p.active = true
          ORDER BY p.name, pr.unit_amount
        `
      );

      const productsMap = new Map();
      for (const row of result.rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stripe/prices', async (_req, res) => {
    try {
      const result = await db.execute(
        sql`SELECT * FROM stripe.prices WHERE active = true ORDER BY unit_amount`
      );
      res.json({ data: result.rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stripe/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const { priceId, successUrl, cancelUrl } = req.body;
      const stripe = await getUncachableStripeClient();

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        success_url: successUrl || `${req.protocol}://${req.get('host')}/erp?payment=success`,
        cancel_url: cancelUrl || `${req.protocol}://${req.get('host')}/erp?payment=cancelled`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
