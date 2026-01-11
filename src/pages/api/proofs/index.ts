import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { proofs, deliverables, users } from '@/db/schema';
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
    case 'PUT':
      return handlePut(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// Helper to parse proof metadata
function parseProof(proof: typeof proofs.$inferSelect) {
  return {
    ...proof,
    metadata: proof.metadata ? JSON.parse(proof.metadata) : null,
  };
}

// GET - List proofs for a deliverable
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { deliverableId, status } = req.query;

    if (!deliverableId || typeof deliverableId !== 'string') {
      return res.status(400).json({ error: 'deliverableId is required' });
    }

    const result = await db
      .select({
        proof: proofs,
        submitter: users,
        reviewer: users,
      })
      .from(proofs)
      .leftJoin(users, eq(proofs.submittedBy, users.id))
      .where(eq(proofs.deliverableId, deliverableId))
      .orderBy(desc(proofs.createdAt))
      .all();

    // Filter by status if provided
    let filtered = result;
    if (status && typeof status === 'string') {
      filtered = result.filter((r) => r.proof.status === status);
    }

    const formattedProofs = filtered.map((row) => ({
      ...parseProof(row.proof),
      submitter: row.submitter,
    }));

    return res.status(200).json({ proofs: formattedProofs });
  } catch (error) {
    console.error('Error fetching proofs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Submit a new proof
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      deliverableId,
      submittedBy,
      proofType,
      content,
      metadata,
    } = req.body;

    if (!deliverableId || !submittedBy || !proofType || !content) {
      return res.status(400).json({ 
        error: 'deliverableId, submittedBy, proofType, and content are required' 
      });
    }

    // Verify deliverable exists
    const deliverable = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, deliverableId))
      .get();

    if (!deliverable) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, submittedBy))
      .get();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const id = uuidv4();
    const newProof = {
      id,
      deliverableId,
      submittedBy,
      proofType,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      status: 'pending',
    };

    await db.insert(proofs).values(newProof);

    // Update deliverable status to submitted
    await db
      .update(deliverables)
      .set({ status: 'submitted', updatedAt: new Date() })
      .where(eq(deliverables.id, deliverableId));

    const proof = await db
      .select()
      .from(proofs)
      .where(eq(proofs.id, id))
      .get();

    return res.status(201).json({ proof: proof ? parseProof(proof) : null });
  } catch (error) {
    console.error('Error creating proof:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Review/update a proof
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      status,
      reviewedBy,
      reviewNotes,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Proof id is required' });
    }

    const existingProof = await db
      .select()
      .from(proofs)
      .where(eq(proofs.id, id))
      .get();

    if (!existingProof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      updateData.status = status;
      
      if (status === 'approved' || status === 'rejected') {
        updateData.reviewedAt = new Date();
        if (reviewedBy) {
          updateData.reviewedBy = reviewedBy;
        }

        // Update deliverable status based on proof review
        if (status === 'approved') {
          await db
            .update(deliverables)
            .set({ status: 'verified', completedAt: new Date(), updatedAt: new Date() })
            .where(eq(deliverables.id, existingProof.deliverableId));
        } else if (status === 'rejected') {
          // Check if there are other pending/approved proofs
          const otherProofs = await db
            .select()
            .from(proofs)
            .where(eq(proofs.deliverableId, existingProof.deliverableId))
            .all();

          const hasApprovedProof = otherProofs.some(
            (p) => p.id !== id && p.status === 'approved'
          );

          if (!hasApprovedProof) {
            await db
              .update(deliverables)
              .set({ status: 'pending', updatedAt: new Date() })
              .where(eq(deliverables.id, existingProof.deliverableId));
          }
        }
      }
    }

    if (reviewNotes !== undefined) {
      updateData.reviewNotes = reviewNotes;
    }

    await db
      .update(proofs)
      .set(updateData)
      .where(eq(proofs.id, id));

    const proof = await db
      .select()
      .from(proofs)
      .where(eq(proofs.id, id))
      .get();

    return res.status(200).json({ proof: proof ? parseProof(proof) : null });
  } catch (error) {
    console.error('Error updating proof:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
