import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { creatorProfiles, users, offerings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  try {
    // Fetch all active creator profiles with user info
    const creators = await db
      .select({
        profile: creatorProfiles,
        user: users,
      })
      .from(creatorProfiles)
      .leftJoin(users, eq(creatorProfiles.userId, users.id))
      .where(eq(creatorProfiles.isActive, true))
      .orderBy(desc(creatorProfiles.reputationScore))
      .all();

    // Fetch offerings for each creator
    const creatorsWithOfferings = await Promise.all(
      creators.map(async (row) => {
        const creatorOfferings = await db
          .select()
          .from(offerings)
          .where(eq(offerings.creatorId, row.profile.id))
          .all();

        // Parse JSON fields
        return {
          ...row.profile,
          specialties: row.profile.specialties ? JSON.parse(row.profile.specialties) : [],
          communities: row.profile.communities ? JSON.parse(row.profile.communities) : [],
          socialLinks: row.profile.socialLinks ? JSON.parse(row.profile.socialLinks) : {},
          user: row.user,
          offerings: creatorOfferings.map((o) => ({
            ...o,
            deliverableTypes: o.deliverableTypes ? JSON.parse(o.deliverableTypes) : [],
          })),
        };
      })
    );

    return res.status(200).json({ creators: creatorsWithOfferings });
  } catch (error) {
    console.error('Error fetching creators:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
