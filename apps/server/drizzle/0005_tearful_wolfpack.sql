ALTER TABLE `highlights` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `highlights` ADD `type` text DEFAULT 'highlight' NOT NULL;--> statement-breakpoint
ALTER TABLE `images` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `images` ADD `type` text DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE `notes` ADD `user_id` text NOT NULL REFERENCES user(id);--> statement-breakpoint
ALTER TABLE `pages` ADD `user_id` text NOT NULL REFERENCES user(id);