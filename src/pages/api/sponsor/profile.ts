import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { sponsorProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
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

// GET - Fetch sponsor profile by userId
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required' });
    }

    const profile = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.userId, userId))
      .get();

    if (!profile) {
      return res.status(404).json({ error: 'Sponsor profile not found' });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Error fetching sponsor profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Create a new sponsor profile
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      userId,
      name,
      industry,
      description,
      location,
      website,
      logoUrl,
      budgetRangeMin,
      budgetRangeMax,
      paymentMethod,
    } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ error: 'userId and name are required' });
    }

    // Verify user exists
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.userId, userId))
      .get();

    if (existingProfile) {
      return res.status(409).json({ error: 'Sponsor profile already exists for this user' });
    }

    const id = uuidv4();
    const newProfile = {
      id,
      userId,
      name,
      industry: industry || null,
      description: description || null,
      location: location || null,
      website: website || null,
      logoUrl: logoUrl || null,
      budgetRangeMin: budgetRangeMin || null,
      budgetRangeMax: budgetRangeMax || null,
      paymentMethod: paymentMethod || 'off-chain',
      isActive: true,
    };

    await db.insert(sponsorProfiles).values(newProfile);

    const profile = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.id, id))
      .get();

    return res.status(201).json({ profile });
  } catch (error) {
    console.error('Error creating sponsor profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update sponsor profile
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      name,
      industry,
      description,
      location,
      website,
      logoUrl,
      budgetRangeMin,
      budgetRangeMax,
      paymentMethod,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Profile id is required' });
    }

    const existingProfile = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.id, id))
      .get();

    if (!existingProfile) {
      return res.status(404).json({ error: 'Sponsor profile not found' });
    }

    await db
      .update(sponsorProfiles)
      .set({
        name: name ?? existingProfile.name,
        industry: industry !== undefined ? industry : existingProfile.industry,
        description: description !== undefined ? description : existingProfile.description,
        location: location !== undefined ? location : existingProfile.location,
        website: website !== undefined ? website : existingProfile.website,
        logoUrl: logoUrl !== undefined ? logoUrl : existingProfile.logoUrl,
        budgetRangeMin: budgetRangeMin !== undefined ? budgetRangeMin : existingProfile.budgetRangeMin,
        budgetRangeMax: budgetRangeMax !== undefined ? budgetRangeMax : existingProfile.budgetRangeMax,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : existingProfile.paymentMethod,
        isActive: isActive !== undefined ? isActive : existingProfile.isActive,
        updatedAt: new Date(),
      })
      .where(eq(sponsorProfiles.id, id));

    const profile = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.id, id))
      .get();

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Error updating sponsor profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Delete sponsor profile (soft delete by setting isActive to false)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Profile id is required' });
    }

    const existingProfile = await db
      .select()
      .from(sponsorProfiles)
      .where(eq(sponsorProfiles.id, id))
      .get();

    if (!existingProfile) {
      return res.status(404).json({ error: 'Sponsor profile not found' });
    }

    await db
      .update(sponsorProfiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(sponsorProfiles.id, id));

    return res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting sponsor profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
