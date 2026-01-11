import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// ============================================
// CORE USER TABLES
// ============================================

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  fid: text('fid').notNull().unique(),
  username: text('username'),
  displayName: text('displayName'),
  pfpUrl: text('pfpUrl'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Farcaster Accounts table
export const farcasterAccounts = sqliteTable('farcaster_accounts', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  fid: text('fid').notNull().unique(),
  username: text('username').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ============================================
// SPONSOR MANAGEMENT TABLES
// ============================================

// Sponsor Profiles - Business identity for sponsors
export const sponsorProfiles = sqliteTable('sponsor_profiles', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  name: text('name').notNull(), // Business name
  industry: text('industry'), // e.g., "Restaurant", "Retail", "Studio"
  description: text('description'),
  location: text('location'), // City/neighborhood
  website: text('website'),
  logoUrl: text('logoUrl'),
  budgetRangeMin: real('budgetRangeMin'), // Minimum budget per campaign
  budgetRangeMax: real('budgetRangeMax'), // Maximum budget per campaign
  paymentMethod: text('paymentMethod'), // "wallet", "off-chain", "both"
  isActive: integer('isActive', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Creator Profiles - Creative identity for creators
export const creatorProfiles = sqliteTable('creator_profiles', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id),
  displayName: text('displayName').notNull(),
  bio: text('bio'),
  specialties: text('specialties'), // JSON array of specialties (e.g., ["music", "art", "events"])
  communities: text('communities'), // JSON array of community affiliations
  portfolioUrl: text('portfolioUrl'),
  socialLinks: text('socialLinks'), // JSON object with social media links
  reputationScore: real('reputationScore').default(0),
  completedCampaigns: integer('completedCampaigns').default(0),
  payoutMethod: text('payoutMethod'), // "wallet", "off-chain"
  walletAddress: text('walletAddress'),
  isActive: integer('isActive', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Creator Offerings - Sponsorship packages defined by creators
export const offerings = sqliteTable('offerings', {
  id: text('id').primaryKey(),
  creatorId: text('creatorId').notNull().references(() => creatorProfiles.id),
  title: text('title').notNull(),
  description: text('description'),
  deliverableTypes: text('deliverableTypes').notNull(), // JSON array of deliverable types included
  basePrice: real('basePrice'), // Suggested price
  estimatedDuration: text('estimatedDuration'), // e.g., "1 week", "1 month"
  isActive: integer('isActive', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Sponsorship Campaigns - Links sponsors to creators
export const campaigns = sqliteTable('campaigns', {
  id: text('id').primaryKey(),
  sponsorId: text('sponsorId').notNull().references(() => sponsorProfiles.id),
  creatorId: text('creatorId').references(() => creatorProfiles.id), // Can be null for open campaigns
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'), // draft, active, completed, disputed, cancelled
  startDate: integer('startDate', { mode: 'timestamp' }),
  endDate: integer('endDate', { mode: 'timestamp' }),
  // Compensation
  compensationType: text('compensationType').notNull(), // "cash", "credit", "hybrid"
  cashAmount: real('cashAmount'),
  creditAmount: real('creditAmount'),
  // Metadata
  notes: text('notes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Deliverables - Tasks within campaigns
export const deliverables = sqliteTable('deliverables', {
  id: text('id').primaryKey(),
  campaignId: text('campaignId').notNull().references(() => campaigns.id),
  type: text('type').notNull(), // "event_appearance", "content_post", "check_in", "custom"
  title: text('title').notNull(),
  description: text('description'),
  deadline: integer('deadline', { mode: 'timestamp' }),
  verificationMethod: text('verificationMethod').notNull(), // "manual_upload", "qr_checkin", "link_submission"
  status: text('status').notNull().default('pending'), // pending, in_progress, submitted, verified, rejected
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Proofs - Verification records for deliverables
export const proofs = sqliteTable('proofs', {
  id: text('id').primaryKey(),
  deliverableId: text('deliverableId').notNull().references(() => deliverables.id),
  submittedBy: text('submittedBy').notNull().references(() => users.id),
  proofType: text('proofType').notNull(), // "image", "link", "text", "qr_scan", "attendance"
  content: text('content').notNull(), // URL for images/links, text content, or JSON metadata
  metadata: text('metadata'), // Additional JSON metadata (e.g., location, timestamp details)
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  reviewedBy: text('reviewedBy').references(() => users.id),
  reviewedAt: integer('reviewedAt', { mode: 'timestamp' }),
  reviewNotes: text('reviewNotes'),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// Credits - Sponsor-issued credits/rewards
export const credits = sqliteTable('credits', {
  id: text('id').primaryKey(),
  sponsorId: text('sponsorId').notNull().references(() => sponsorProfiles.id),
  campaignId: text('campaignId').references(() => campaigns.id), // Optional: linked to specific campaign
  recipientId: text('recipientId').references(() => users.id), // Who received the credit
  title: text('title').notNull(),
  description: text('description'),
  value: real('value').notNull(), // Monetary value
  redemptionRules: text('redemptionRules'), // JSON describing how to redeem
  expiresAt: integer('expiresAt', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'), // active, redeemed, expired, cancelled
  redeemedAt: integer('redeemedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  sponsorProfile: one(sponsorProfiles, {
    fields: [users.id],
    references: [sponsorProfiles.userId],
  }),
  creatorProfile: one(creatorProfiles, {
    fields: [users.id],
    references: [creatorProfiles.userId],
  }),
  submittedProofs: many(proofs),
  receivedCredits: many(credits),
}));

export const sponsorProfilesRelations = relations(sponsorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [sponsorProfiles.userId],
    references: [users.id],
  }),
  campaigns: many(campaigns),
  credits: many(credits),
}));

export const creatorProfilesRelations = relations(creatorProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [creatorProfiles.userId],
    references: [users.id],
  }),
  offerings: many(offerings),
  campaigns: many(campaigns),
}));

export const offeringsRelations = relations(offerings, ({ one }) => ({
  creator: one(creatorProfiles, {
    fields: [offerings.creatorId],
    references: [creatorProfiles.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  sponsor: one(sponsorProfiles, {
    fields: [campaigns.sponsorId],
    references: [sponsorProfiles.id],
  }),
  creator: one(creatorProfiles, {
    fields: [campaigns.creatorId],
    references: [creatorProfiles.id],
  }),
  deliverables: many(deliverables),
  credits: many(credits),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [deliverables.campaignId],
    references: [campaigns.id],
  }),
  proofs: many(proofs),
}));

export const proofsRelations = relations(proofs, ({ one }) => ({
  deliverable: one(deliverables, {
    fields: [proofs.deliverableId],
    references: [deliverables.id],
  }),
  submitter: one(users, {
    fields: [proofs.submittedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [proofs.reviewedBy],
    references: [users.id],
  }),
}));

export const creditsRelations = relations(credits, ({ one }) => ({
  sponsor: one(sponsorProfiles, {
    fields: [credits.sponsorId],
    references: [sponsorProfiles.id],
  }),
  campaign: one(campaigns, {
    fields: [credits.campaignId],
    references: [campaigns.id],
  }),
  recipient: one(users, {
    fields: [credits.recipientId],
    references: [users.id],
  }),
}));

// ============================================
// TYPE EXPORTS
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type SponsorProfile = typeof sponsorProfiles.$inferSelect;
export type NewSponsorProfile = typeof sponsorProfiles.$inferInsert;

export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type NewCreatorProfile = typeof creatorProfiles.$inferInsert;

export type Offering = typeof offerings.$inferSelect;
export type NewOffering = typeof offerings.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type Deliverable = typeof deliverables.$inferSelect;
export type NewDeliverable = typeof deliverables.$inferInsert;

export type Proof = typeof proofs.$inferSelect;
export type NewProof = typeof proofs.$inferInsert;

export type Credit = typeof credits.$inferSelect;
export type NewCredit = typeof credits.$inferInsert;
