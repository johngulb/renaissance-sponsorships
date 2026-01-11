import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { creatorProfiles, users } from '@/db/schema';
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

// GET - Fetch creator profile by userId
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId, id } = req.query;

    let profile;
    
    if (id && typeof id === 'string') {
      profile = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.id, id))
        .get();
    } else if (userId && typeof userId === 'string') {
      profile = await db
        .select()
        .from(creatorProfiles)
        .where(eq(creatorProfiles.userId, userId))
        .get();
    } else {
      return res.status(400).json({ error: 'userId or id is required' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    // Parse JSON fields
    const parsedProfile = {
      ...profile,
      specialties: profile.specialties ? JSON.parse(profile.specialties) : [],
      communities: profile.communities ? JSON.parse(profile.communities) : [],
      socialLinks: profile.socialLinks ? JSON.parse(profile.socialLinks) : {},
    };

    return res.status(200).json({ profile: parsedProfile });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST - Create a new creator profile
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      userId,
      displayName,
      bio,
      specialties,
      communities,
      portfolioUrl,
      socialLinks,
      payoutMethod,
      walletAddress,
    } = req.body;

    if (!userId || !displayName) {
      return res.status(400).json({ error: 'userId and displayName are required' });
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
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, userId))
      .get();

    if (existingProfile) {
      return res.status(409).json({ error: 'Creator profile already exists for this user' });
    }

    const id = uuidv4();
    const newProfile = {
      id,
      userId,
      displayName,
      bio: bio || null,
      specialties: specialties ? JSON.stringify(specialties) : null,
      communities: communities ? JSON.stringify(communities) : null,
      portfolioUrl: portfolioUrl || null,
      socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
      reputationScore: 0,
      completedCampaigns: 0,
      payoutMethod: payoutMethod || 'off-chain',
      walletAddress: walletAddress || null,
      isActive: true,
    };

    await db.insert(creatorProfiles).values(newProfile);

    const profile = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, id))
      .get();

    // Parse JSON fields for response
    const parsedProfile = profile ? {
      ...profile,
      specialties: profile.specialties ? JSON.parse(profile.specialties) : [],
      communities: profile.communities ? JSON.parse(profile.communities) : [],
      socialLinks: profile.socialLinks ? JSON.parse(profile.socialLinks) : {},
    } : null;

    return res.status(201).json({ profile: parsedProfile });
  } catch (error) {
    console.error('Error creating creator profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT - Update creator profile
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  try {
    const {
      id,
      displayName,
      bio,
      specialties,
      communities,
      portfolioUrl,
      socialLinks,
      payoutMethod,
      walletAddress,
      isActive,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Profile id is required' });
    }

    const existingProfile = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, id))
      .get();

    if (!existingProfile) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    await db
      .update(creatorProfiles)
      .set({
        displayName: displayName ?? existingProfile.displayName,
        bio: bio !== undefined ? bio : existingProfile.bio,
        specialties: specialties !== undefined ? JSON.stringify(specialties) : existingProfile.specialties,
        communities: communities !== undefined ? JSON.stringify(communities) : existingProfile.communities,
        portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : existingProfile.portfolioUrl,
        socialLinks: socialLinks !== undefined ? JSON.stringify(socialLinks) : existingProfile.socialLinks,
        payoutMethod: payoutMethod !== undefined ? payoutMethod : existingProfile.payoutMethod,
        walletAddress: walletAddress !== undefined ? walletAddress : existingProfile.walletAddress,
        isActive: isActive !== undefined ? isActive : existingProfile.isActive,
        updatedAt: new Date(),
      })
      .where(eq(creatorProfiles.id, id));

    const profile = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, id))
      .get();

    // Parse JSON fields for response
    const parsedProfile = profile ? {
      ...profile,
      specialties: profile.specialties ? JSON.parse(profile.specialties) : [],
      communities: profile.communities ? JSON.parse(profile.communities) : [],
      socialLinks: profile.socialLinks ? JSON.parse(profile.socialLinks) : {},
    } : null;

    return res.status(200).json({ profile: parsedProfile });
  } catch (error) {
    console.error('Error updating creator profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE - Delete creator profile (soft delete)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Profile id is required' });
    }

    const existingProfile = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.id, id))
      .get();

    if (!existingProfile) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    await db
      .update(creatorProfiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(creatorProfiles.id, id));

    return res.status(200).json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting creator profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
