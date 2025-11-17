DROP TABLE `web_annotations`;--> statement-breakpoint
ALTER TABLE `annotations` ADD `type` text NOT NULL;--> statement-breakpoint
ALTER TABLE `annotations` ADD `sourceTitle` text NOT NULL;--> statement-breakpoint
ALTER TABLE `annotations` ADD `sourceLink` text NOT NULL;--> statement-breakpoint
ALTER TABLE `annotations` ADD `content` text;--> statement-breakpoint
ALTER TABLE `annotations` ADD `link` text;--> statement-breakpoint
ALTER TABLE `annotations` ADD `comment` text;--> statement-breakpoint
ALTER TABLE `annotations` DROP COLUMN `sourceId`;