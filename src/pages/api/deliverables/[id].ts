import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { deliverables, proofs, campaigns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Deliverable id is required' });
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

// GET - Fetch single deliverable with proofs
async function handleGet(id: string, res: NextApiResponse) {
  try {
    const deliverable = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, id))
      .get();

    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    // Fetch associated proofs
    const deliverableProofs = await db
      .select()
      .from(proofs)
      .where(eq(proofs.deliverableId, id))
      .all();

    // Parse metadata for each proof
    const parsedProofs = deliverableProofs.map((proof) => ({
      ...proof,
      metadata: proof.metadata ? JSON.parse(proof.metadata) : null,
    }));

    return res.status(200).json({
      deliverable: {
        ...deliverable,
        proofs: parsedProofs,
      },
    });
  } catch (error) {
    console.error('Error fetching deliverable:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update deliverable
async function handlePut(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      type,
      title,
      description,
      deadline,
      verificationMethod,
      status,
    } = req.body;

    const existingDeliverable = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, id))
      .get();

    if (!existingDeliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (type !== undefined) updateData.type = type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) {
      updateData.deadline = deadline ? new Date(deadline) : null;
    }
    if (verificationMethod !== undefined) {
      updateData.verificationMethod = verificationMethod;
    }
    if (status !== undefined) {
      updateData.status = status;
      // Set completedAt when status changes to verified
      if (status === 'verified') {
        updateData.completedAt = new Date();
        
        // Update campaign progress - check if all deliverables are verified
        const campaign = await db
          .select()
          .from(campaigns)
          .where(eq(campaigns.id, existingDeliverable.campaignId))
          .get();

        if (campaign) {
          const allDeliverables = await db
            .select()
            .from(deliverables)
            .where(eq(deliverables.campaignId, campaign.id))
            .all();

          // Count verified (including current one being updated)
          const verifiedCount = allDeliverables.filter(
            (d) => d.id === id || d.status === 'verified'
          ).length;

          // If all deliverables are verified, mark campaign as completed
          if (verifiedCount === allDeliverables.length) {
            await db
              .update(campaigns)
              .set({ status: 'completed', updatedAt: new Date() })
              .where(eq(campaigns.id, campaign.id));
          }
        }
      }
    }

    await db
      .update(deliverables)
      .set(updateData)
      .where(eq(deliverables.id, id));

    return handleGet(id, res);
  } catch (error) {
    console.error('Error updating deliverable:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Delete deliverable and its proofs
async function handleDelete(id: string, res: NextApiResponse) {
  try {
    const existingDeliverable = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, id))
      .get();

    if (!existingDeliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    // Delete associated proofs first
    await db.delete(proofs).where(eq(proofs.deliverableId, id));

    // Delete deliverable
    await db.delete(deliverables).where(eq(deliverables.id, id));

    return res.status(200).json({ message: 'Deliverable deleted successfully' });
  } catch (error) {
    console.error('Error deleting deliverable:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Utility endpoint to add a deliverable to a campaign
export async function createDeliverable(
  campaignId: string,
  data: {
    type: string;
    title: string;
    description?: string;
    deadline?: string;
    verificationMethod?: string;
  }
) {
  const id = uuidv4();
  await db.insert(deliverables).values({
    id,
    campaignId,
    type: data.type,
    title: data.title,
    description: data.description || null,
    deadline: data.deadline ? new Date(data.deadline) : null,
    verificationMethod: data.verificationMethod || 'manual_upload',
    status: 'pending',
  });
  return id;
}
