CREATE TABLE `campaigns` (
	`id` text PRIMARY KEY NOT NULL,
	`sponsorId` text NOT NULL,
	`creatorId` text,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`startDate` integer,
	`endDate` integer,
	`compensationType` text NOT NULL,
	`cashAmount` real,
	`creditAmount` real,
	`notes` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`sponsorId`) REFERENCES `sponsor_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`creatorId`) REFERENCES `creator_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `creator_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`displayName` text NOT NULL,
	`bio` text,
	`specialties` text,
	`communities` text,
	`portfolioUrl` text,
	`socialLinks` text,
	`reputationScore` real DEFAULT 0,
	`completedCampaigns` integer DEFAULT 0,
	`payoutMethod` text,
	`walletAddress` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `credits` (
	`id` text PRIMARY KEY NOT NULL,
	`sponsorId` text NOT NULL,
	`campaignId` text,
	`recipientId` text,
	`title` text NOT NULL,
	`description` text,
	`value` real NOT NULL,
	`redemptionRules` text,
	`expiresAt` integer,
	`status` text DEFAULT 'active' NOT NULL,
	`redeemedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`sponsorId`) REFERENCES `sponsor_profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` text PRIMARY KEY NOT NULL,
	`campaignId` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`deadline` integer,
	`verificationMethod` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `offerings` (
	`id` text PRIMARY KEY NOT NULL,
	`creatorId` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`deliverableTypes` text NOT NULL,
	`basePrice` real,
	`estimatedDuration` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`creatorId`) REFERENCES `creator_profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `proofs` (
	`id` text PRIMARY KEY NOT NULL,
	`deliverableId` text NOT NULL,
	`submittedBy` text NOT NULL,
	`proofType` text NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewedBy` text,
	`reviewedAt` integer,
	`reviewNotes` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`deliverableId`) REFERENCES `deliverables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sponsor_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`name` text NOT NULL,
	`industry` text,
	`description` text,
	`location` text,
	`website` text,
	`logoUrl` text,
	`budgetRangeMin` real,
	`budgetRangeMax` real,
	`paymentMethod` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
