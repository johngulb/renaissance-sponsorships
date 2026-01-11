import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { credits, sponsorProfiles, users, campaigns } from '@/db/schema';
import { eq, and, desc, or } from 'drizzle-orm';
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
    case 'PUT':
      return handlePut(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// GET - List credits with filters
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { sponsorId, recipientId, status, userId } = req.query;

    const query = db
      .select({
        credit: credits,
        sponsor: sponsorProfiles,
        recipient: users,
        campaign: campaigns,
      })
      .from(credits)
      .leftJoin(sponsorProfiles, eq(credits.sponsorId, sponsorProfiles.id))
      .leftJoin(users, eq(credits.recipientId, users.id))
      .leftJoin(campaigns, eq(credits.campaignId, campaigns.id))
      .orderBy(desc(credits.createdAt));

    const conditions = [];

    if (sponsorId && typeof sponsorId === 'string') {
      conditions.push(eq(credits.sponsorId, sponsorId));
    }

    if (recipientId && typeof recipientId === 'string') {
      conditions.push(eq(credits.recipientId, recipientId));
    }

    if (status && typeof status === 'string') {
      conditions.push(eq(credits.status, status));
    }

    // If userId is provided, find credits where user is either sponsor or recipient
    if (userId && typeof userId === 'string') {
      const sponsorProfile = await db
        .select()
        .from(sponsorProfiles)
        .where(eq(sponsorProfiles.userId, userId))
        .get();

      const userConditions = [];
      if (sponsorProfile) {
        userConditions.push(eq(credits.sponsorId, sponsorProfile.id));
      }
      userConditions.push(eq(credits.recipientId, userId));

      if (userConditions.length > 0) {
        conditions.push(or(...userConditions));
      }
    }

    let result;
    if (conditions.length > 0) {
      result = await query.where(and(...conditions)).all();
    } else {
      result = await query.all();
    }

    const formattedCredits = result.map((row) => ({
      ...row.credit,
      sponsor: row.sponsor,
      recipient: row.recipient,
      campaign: row.campaign,
    }));

    return res.status(200).json({ credits: formattedCredits });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Issue a new credit
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      sponsorId,
      campaignId,
      recipientId,
      title,
      description,
      value,
      redemptionRules,
      expiresAt,
    } = req.body;

    if (!sponsorId || !title || value === undefined) {
      return res.status(400).json({ 
        error: 'sponsorId, title, and value are required' 
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

    // Verify recipient if provided
    if (recipientId) {
      const recipient = await db
        .select()
        .from(users)
        .where(eq(users.id, recipientId))
        .get();

      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }
    }

    // Verify campaign if provided
    if (campaignId) {
      const campaign = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .get();

      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' });
      }
    }

    const id = uuidv4();
    const newCredit = {
      id,
      sponsorId,
      campaignId: campaignId || null,
      recipientId: recipientId || null,
      title,
      description: description || null,
      value,
      redemptionRules: redemptionRules ? JSON.stringify(redemptionRules) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      status: 'active',
    };

    await db.insert(credits).values(newCredit);

    const createdCredit = await db
      .select({
        credit: credits,
        sponsor: sponsorProfiles,
        recipient: users,
        campaign: campaigns,
      })
      .from(credits)
      .leftJoin(sponsorProfiles, eq(credits.sponsorId, sponsorProfiles.id))
      .leftJoin(users, eq(credits.recipientId, users.id))
      .leftJoin(campaigns, eq(credits.campaignId, campaigns.id))
      .where(eq(credits.id, id))
      .get();

    return res.status(201).json({
      credit: {
        ...createdCredit?.credit,
        sponsor: createdCredit?.sponsor,
        recipient: createdCredit?.recipient,
        campaign: createdCredit?.campaign,
      },
    });
  } catch (error) {
    console.error('Error creating credit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update credit (e.g., redeem, cancel)
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      status,
      recipientId,
      title,
      description,
      value,
      redemptionRules,
      expiresAt,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Credit id is required' });
    }

    const existingCredit = await db
      .select()
      .from(credits)
      .where(eq(credits.id, id))
      .get();

    if (!existingCredit) {
      return res.status(404).json({ error: 'Credit not found' });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'redeemed') {
        updateData.redeemedAt = new Date();
      }
    }

    if (recipientId !== undefined) updateData.recipientId = recipientId;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (value !== undefined) updateData.value = value;
    if (redemptionRules !== undefined) {
      updateData.redemptionRules = JSON.stringify(redemptionRules);
    }
    if (expiresAt !== undefined) {
      updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }

    await db
      .update(credits)
      .set(updateData)
      .where(eq(credits.id, id));

    const updatedCredit = await db
      .select({
        credit: credits,
        sponsor: sponsorProfiles,
        recipient: users,
        campaign: campaigns,
      })
      .from(credits)
      .leftJoin(sponsorProfiles, eq(credits.sponsorId, sponsorProfiles.id))
      .leftJoin(users, eq(credits.recipientId, users.id))
      .leftJoin(campaigns, eq(credits.campaignId, campaigns.id))
      .where(eq(credits.id, id))
      .get();

    return res.status(200).json({
      credit: {
        ...updatedCredit?.credit,
        sponsor: updatedCredit?.sponsor,
        recipient: updatedCredit?.recipient,
        campaign: updatedCredit?.campaign,
      },
    });
  } catch (error) {
    console.error('Error updating credit:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
