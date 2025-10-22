ALTER TABLE `notes` ADD `type` text DEFAULT 'note' NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` ADD `type` text DEFAULT 'page' NOT NULL;