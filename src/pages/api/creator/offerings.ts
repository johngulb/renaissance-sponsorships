import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { offerings, creatorProfiles } from '@/db/schema';
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
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }
}

// Helper to parse offering JSON fields
function parseOffering(offering: typeof offerings.$inferSelect) {
  return {
    ...offering,
    deliverableTypes: offering.deliverableTypes ? JSON.parse(offering.deliverableTypes) : [],
  };
}

// GET - List offerings for a creator
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { creatorId, id, userId } = req.query;

    // Fetch single offering by id
    if (id && typeof id === 'string') {
      const offering = await db
        .select()
        .from(offerings)
        .where(eq(offerings.id, id))
        .get();

      if (!offering) {
        return res.status(404).json({ error: 'Offering not found' });
      }

      return res.status(200).json({ offering: parseOffering(offering) });
    }

    // Fetch offerings by creatorId
    if (creatorId && typeof creatorId === 'string') {
      const creatorOfferings = await db
        .select()
        .from(offerings)
        .where(eq(offerings.creatorId, creatorId))
        .orderBy(desc(offerings.createdAt))
        .all();

      return res.status(200).json({ 
        offerings: creatorOfferings.map(parseOffering) 
      });
    }

    // Fetch offerings by userId (get creator profile first)
    if (userId && typeof userId === 'string') {
      const creatorProfile = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, userId))
        .get();

      if (!creatorProfile) {
        return res.status(404).json({ error: 'Creator profile not found' });
      }

      const creatorOfferings = await db
        .select()
        .from(offerings)
        .where(eq(offerings.creatorId, creatorProfile.id))
        .orderBy(desc(offerings.createdAt))
        .all();

      return res.status(200).json({ 
        offerings: creatorOfferings.map(parseOffering) 
      });
    }

    // Fetch all active offerings (for discovery)
    const allOfferings = await db
      .select({
        offering: offerings,
        creator: creatorProfiles,
      })
      .from(offerings)
      .leftJoin(creatorProfiles, eq(offerings.creatorId, creatorProfiles.id))
      .where(eq(offerings.isActive, true))
      .orderBy(desc(offerings.createdAt))
      .all();

    return res.status(200).json({
      offerings: allOfferings.map((row) => ({
        ...parseOffering(row.offering),
        creator: row.creator,
      })),
    });
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Create a new offering
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      creatorId,
      title,
      description,
      deliverableTypes,
      basePrice,
      estimatedDuration,
    } = req.body;

    if (!creatorId || !title || !deliverableTypes) {
      return res.status(400).json({ 
        error: 'creatorId, title, and deliverableTypes are required' 
      });
    }

    // Verify creator exists
    const creator = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, creatorId))
      .get();

    if (!creator) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    const id = uuidv4();
    const newOffering = {
      id,
      creatorId,
      title,
      description: description || null,
      deliverableTypes: JSON.stringify(deliverableTypes),
      basePrice: basePrice || null,
      estimatedDuration: estimatedDuration || null,
      isActive: true,
    };

    await db.insert(offerings).values(newOffering);

    const offering = await db
      .select()
      .from(offerings)
      .where(eq(offerings.id, id))
      .get();

    return res.status(201).json({ 
      offering: offering ? parseOffering(offering) : null 
    });
  } catch (error) {
    console.error('Error creating offering:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update offering
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      title,
      description,
      deliverableTypes,
      basePrice,
      estimatedDuration,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Offering id is required' });
    }

    const existingOffering = await db
      .select()
      .from(offerings)
      .where(eq(offerings.id, id))
      .get();

    if (!existingOffering) {
      return res.status(404).json({ error: 'Offering not found' });
    }

    await db
      .update(offerings)
      .set({
        title: title ?? existingOffering.title,
        description: description !== undefined ? description : existingOffering.description,
        deliverableTypes: deliverableTypes !== undefined 
          ? JSON.stringify(deliverableTypes) 
          : existingOffering.deliverableTypes,
        basePrice: basePrice !== undefined ? basePrice : existingOffering.basePrice,
        estimatedDuration: estimatedDuration !== undefined 
          ? estimatedDuration 
          : existingOffering.estimatedDuration,
        isActive: isActive !== undefined ? isActive : existingOffering.isActive,
        updatedAt: new Date(),
      })
      .where(eq(offerings.id, id));

    const offering = await db
      .select()
      .from(offerings)
      .where(eq(offerings.id, id))
      .get();

    return res.status(200).json({ 
      offering: offering ? parseOffering(offering) : null 
    });
  } catch (error) {
    console.error('Error updating offering:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Delete offering (soft delete)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Offering id is required' });
    }

    const existingOffering = await db
      .select()
      .from(offerings)
      .where(eq(offerings.id, id))
      .get();

    if (!existingOffering) {
      return res.status(404).json({ error: 'Offering not found' });
    }

    await db
      .update(offerings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(offerings.id, id));

    return res.status(200).json({ message: 'Offering deleted successfully' });
  } catch (error) {
    console.error('Error deleting offering:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
