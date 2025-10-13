ALTER TABLE `highlights` ADD `type` text DEFAULT 'highlight' NOT NULL;--> statement-breakpoint
ALTER TABLE `images` ADD `type` text DEFAULT 'image' NOT NULL;