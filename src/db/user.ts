import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { users, farcasterAccounts } from './schema';

export interface User {
  id: string;
  fid: string;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarcasterAccount {
  id: string;
  userId: string;
  fid: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FarcasterUserData {
  fid: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

export async function getUserByFid(fid: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.fid, fid))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserById(userId: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    fid: row.fid,
    username: row.username,
    displayName: row.displayName,
    pfpUrl: row.pfpUrl,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as User;
}


export async function getOrCreateUserByFid(
  fid: string,
  userData?: FarcasterUserData
): Promise<User> {
  const existing = await getUserByFid(fid);
  
  if (existing) {
    // Update user if new data is provided
    if (userData) {
      const now = new Date();
      const updateData: {
        username?: string | null;
        displayName?: string | null;
        pfpUrl?: string | null;
        updatedAt: Date;
      } = { updatedAt: now };
      
      if (userData.username !== undefined) updateData.username = userData.username;
      if (userData.displayName !== undefined) updateData.displayName = userData.displayName;
      if (userData.pfpUrl !== undefined) updateData.pfpUrl = userData.pfpUrl;
      
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, existing.id));
      
      return {
        ...existing,
        ...updateData,
      } as User;
    }
    
    return existing;
  }
  
  // Create new user
  const id = uuidv4();
  const now = new Date();
  const newUser = {
    id,
    fid,
    username: userData?.username || null,
    displayName: userData?.displayName || null,
    pfpUrl: userData?.pfpUrl || null,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(users).values(newUser);
  
  return newUser as User;
}

export async function upsertFarcasterAccount(
  userId: string,
  farcasterData: { fid: string; username: string }
): Promise<FarcasterAccount> {
  const existing = await db
    .select()
    .from(farcasterAccounts)
    .where(eq(farcasterAccounts.fid, farcasterData.fid))
    .limit(1);
  
  const now = new Date();
  
  if (existing.length > 0) {
    const existingAccount = existing[0];
    await db
      .update(farcasterAccounts)
      .set({
        userId,
        username: farcasterData.username,
        updatedAt: now,
      })
      .where(eq(farcasterAccounts.id, existingAccount.id));
    
    return {
      id: existingAccount.id,
      userId,
      fid: farcasterData.fid,
      username: farcasterData.username,
      createdAt: existingAccount.createdAt || now,
      updatedAt: now,
    } as FarcasterAccount;
  }
  
  const id = uuidv4();
  const record = {
    id,
    userId,
    fid: farcasterData.fid,
    username: farcasterData.username,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.insert(farcasterAccounts).values(record);
  return record as FarcasterAccount;
}

export async function getFarcasterAccountByFid(
  fid: string
): Promise<FarcasterAccount | null> {
  const results = await db
    .select()
    .from(farcasterAccounts)
    .where(eq(farcasterAccounts.fid, fid))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    id: row.id,
    userId: row.userId,
    fid: row.fid,
    username: row.username,
    createdAt: row.createdAt || new Date(),
    updatedAt: row.updatedAt || new Date(),
  } as FarcasterAccount;
}
