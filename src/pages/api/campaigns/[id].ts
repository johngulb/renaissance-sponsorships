import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { campaigns, sponsorProfiles, creatorProfiles, deliverables, proofs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Campaign id is required' });
  }

  switch (method) {
    case 'GET':
      return handleGet(id, res);
    case 'PUT':
      return handlePut(id, req, res);
    case 'DELETE':
      return handleDelete(id, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// GET - Fetch single campaign with full details
async function handleGet(id: string, res: NextApiResponse) {
  try {
    const result = await db
      .select({
        campaign: campaigns,
        sponsor: sponsorProfiles,
        creator: creatorProfiles,
      })
      .from(campaigns)
      .leftJoin(sponsorProfiles, eq(campaigns.sponsorId, sponsorProfiles.id))
      .leftJoin(creatorProfiles, eq(campaigns.creatorId, creatorProfiles.id))
      .where(eq(campaigns.id, id))
      .get();

    if (!result) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Fetch deliverables with their proofs
    const campaignDeliverables = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.campaignId, id))
      .all();

    // Fetch proofs for each deliverable
    const deliverablesWithProofs = await Promise.all(
      campaignDeliverables.map(async (deliverable) => {
        const deliverableProofs = await db
          .select()
          .from(proofs)
          .where(eq(proofs.deliverableId, deliverable.id))
          .all();
        return {
          ...deliverable,
          proofs: deliverableProofs,
        };
      })
    );

    return res.status(200).json({
      campaign: {
        ...result.campaign,
        sponsor: result.sponsor,
        creator: result.creator,
        deliverables: deliverablesWithProofs,
      },
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update campaign
async function handlePut(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
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
    } = req.body;

    const existingCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .get();

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Verify creator if being updated
    if (creatorId && creatorId !== existingCampaign.creatorId) {
      const creator = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.id, creatorId))
        .get();

      if (!creator) {
        return res.status(404).json({ error: 'Creator profile not found' });
      }
    }

    await db
      .update(campaigns)
      .set({
        creatorId: creatorId !== undefined ? creatorId : existingCampaign.creatorId,
        title: title ?? existingCampaign.title,
        description: description !== undefined ? description : existingCampaign.description,
        status: status ?? existingCampaign.status,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existingCampaign.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existingCampaign.endDate,
        compensationType: compensationType ?? existingCampaign.compensationType,
        cashAmount: cashAmount !== undefined ? cashAmount : existingCampaign.cashAmount,
        creditAmount: creditAmount !== undefined ? creditAmount : existingCampaign.creditAmount,
        notes: notes !== undefined ? notes : existingCampaign.notes,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, id));

    // Return updated campaign
    return handleGet(id, res);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Delete campaign (and its deliverables/proofs)
async function handleDelete(id: string, res: NextApiResponse) {
  try {
    const existingCampaign = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .get();

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get all deliverables for this campaign
    const campaignDeliverables = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.campaignId, id))
      .all();

    // Delete proofs for each deliverable
    for (const deliverable of campaignDeliverables) {
      await db.delete(proofs).where(eq(proofs.deliverableId, deliverable.id));
    }

    // Delete deliverables
    await db.delete(deliverables).where(eq(deliverables.campaignId, id));

    // Delete campaign
    await db.delete(campaigns).where(eq(campaigns.id, id));

    return res.status(200).json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
