import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { campaigns, sponsorProfiles, creatorProfiles, deliverables } from '@/db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
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

// GET - List campaigns with filters
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sponsorId, creatorId, status, userId } = req.query;

    const query = db
      .select({
        campaign: campaigns,
        sponsor: sponsorProfiles,
        creator: creatorProfiles,
      })
      .from(campaigns)
      .leftJoin(sponsorProfiles, eq(campaigns.sponsorId, sponsorProfiles.id))
      .leftJoin(creatorProfiles, eq(campaigns.creatorId, creatorProfiles.id))
      .orderBy(desc(campaigns.createdAt));

    // Build conditions array
    const conditions = [];

    if (sponsorId && typeof sponsorId === 'string') {
      conditions.push(eq(campaigns.sponsorId, sponsorId));
    }

    if (creatorId && typeof creatorId === 'string') {
      conditions.push(eq(campaigns.creatorId, creatorId));
    }

    if (status && typeof status === 'string') {
      conditions.push(eq(campaigns.status, status));
    }

    // If userId is provided, find campaigns where user is either sponsor or creator
    if (userId && typeof userId === 'string') {
      // First get user's sponsor and creator profile IDs
      const sponsorProfile = await db
        .select()
        .from(sponsorProfiles)
        .where(eq(sponsorProfiles.userId, userId))
        .get();

      const creatorProfile = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, userId))
        .get();

      const userConditions = [];
      if (sponsorProfile) {
        userConditions.push(eq(campaigns.sponsorId, sponsorProfile.id));
      }
      if (creatorProfile) {
        userConditions.push(eq(campaigns.creatorId, creatorProfile.id));
      }

      if (userConditions.length > 0) {
        conditions.push(or(...userConditions));
      } else {
        // User has no profiles, return empty
        return res.status(200).json({ campaigns: [] });
      }
    }

    // Apply conditions
    let result;
    if (conditions.length > 0) {
      result = await query.where(and(...conditions)).all();
    } else {
      result = await query.all();
    }

    // Format response
    const formattedCampaigns = result.map((row) => ({
      ...row.campaign,
      sponsor: row.sponsor,
      creator: row.creator,
    }));

    return res.status(200).json({ campaigns: formattedCampaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Create a new campaign
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      sponsorId,
      creatorId,
      title,
      description,
      status,
      startDate,
      endDate,
      compensationType,
      cashAmount,
      creditAmount,
      notes,
      deliverablesList, // Optional: array of deliverables to create with the campaign
    } = req.body;

    if (!sponsorId || !title || !compensationType) {
      return res.status(400).json({ 
        error: 'sponsorId, title, and compensationType are required' 
      });
    }

    // Verify sponsor exists
    const sponsor = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.id, sponsorId))
      .get();

    if (!sponsor) {
      return res.status(404).json({ error: 'Sponsor profile not found' });
    }

    // Verify creator if provided
    if (creatorId) {
      const creator = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.id, creatorId))
        .get();

      if (!creator) {
        return res.status(404).json({ error: 'Creator profile not found' });
      }
    }

    const campaignId = uuidv4();
    const newCampaign = {
      id: campaignId,
      sponsorId,
      creatorId: creatorId || null,
      title,
      description: description || null,
      status: status || 'draft',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      compensationType,
      cashAmount: cashAmount || null,
      creditAmount: creditAmount || null,
      notes: notes || null,
    };

    await db.insert(campaigns).values(newCampaign);

    // Create deliverables if provided
    if (deliverablesList && Array.isArray(deliverablesList)) {
      for (const del of deliverablesList) {
        const deliverableId = uuidv4();
        await db.insert(deliverables).values({
          id: deliverableId,
          campaignId,
          type: del.type || 'custom',
          title: del.title,
          description: del.description || null,
          deadline: del.deadline ? new Date(del.deadline) : null,
          verificationMethod: del.verificationMethod || 'manual_upload',
          status: 'pending',
        });
      }
    }

    // Fetch created campaign with relations
    const createdCampaign = await db
      .select({
        campaign: campaigns,
        sponsor: sponsorProfiles,
        creator: creatorProfiles,
      })
      .from(campaigns)
      .leftJoin(sponsorProfiles, eq(campaigns.sponsorId, sponsorProfiles.id))
      .leftJoin(creatorProfiles, eq(campaigns.creatorId, creatorProfiles.id))
      .where(eq(campaigns.id, campaignId))
      .get();

    // Fetch deliverables
    const campaignDeliverables = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.campaignId, campaignId))
      .all();

    return res.status(201).json({
      campaign: {
        ...createdCampaign?.campaign,
        sponsor: createdCampaign?.sponsor,
        creator: createdCampaign?.creator,
        deliverables: campaignDeliverables,
      },
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
