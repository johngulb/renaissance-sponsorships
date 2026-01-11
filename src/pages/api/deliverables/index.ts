import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { deliverables, campaigns } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// GET - List deliverables for a campaign
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { campaignId, status } = req.query;

    if (!campaignId || typeof campaignId !== 'string') {
      return res.status(400).json({ error: 'campaignId is required' });
    }

    const query = db
      .select()
      .from(deliverables)
      .where(eq(deliverables.campaignId, campaignId))
      .orderBy(desc(deliverables.createdAt));

    const result = await query.all();

    // Filter by status if provided
    let filtered = result;
    if (status && typeof status === 'string') {
      filtered = result.filter((d) => d.status === status);
    }

    return res.status(200).json({ deliverables: filtered });
  } catch (error) {
    console.error('Error fetching deliverables:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Create a new deliverable for a campaign
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      campaignId,
      type,
      title,
      description,
      deadline,
      verificationMethod,
    } = req.body;

    if (!campaignId || !type || !title) {
      return res.status(400).json({ 
        error: 'campaignId, type, and title are required' 
      });
    }

    // Verify campaign exists
    const campaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .get();

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const id = uuidv4();
    const newDeliverable = {
      id,
      campaignId,
      type,
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline) : null,
      verificationMethod: verificationMethod || 'manual_upload',
      status: 'pending',
    };

    await db.insert(deliverables).values(newDeliverable);

    const deliverable = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, id))
      .get();

    return res.status(201).json({ deliverable });
  } catch (error) {
    console.error('Error creating deliverable:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
