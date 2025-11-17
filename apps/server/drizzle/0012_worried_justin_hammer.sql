ALTER TABLE `notes` ADD `is_public` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` ADD `is_public` integer DEFAULT false NOT NULL;