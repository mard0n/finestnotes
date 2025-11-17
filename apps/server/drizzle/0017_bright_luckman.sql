ALTER TABLE `project_notes` RENAME TO `projects_to_notes`;--> statement-breakpoint
ALTER TABLE `project_subscribers` RENAME TO `projects_to_subscribers`;--> statement-breakpoint
ALTER TABLE `projects_to_subscribers` RENAME COLUMN "user_id" TO "author_id";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects_to_notes` (
	`project_id` text NOT NULL,
	`note_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `note_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects_to_notes`("project_id", "note_id") SELECT "project_id", "note_id" FROM `projects_to_notes`;--> statement-breakpoint
DROP TABLE `projects_to_notes`;--> statement-breakpoint
ALTER TABLE `__new_projects_to_notes` RENAME TO `projects_to_notes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_projects_to_subscribers` (
	`project_id` text NOT NULL,
	`author_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `author_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_projects_to_subscribers`("project_id", "author_id") SELECT "project_id", "author_id" FROM `projects_to_subscribers`;--> statement-breakpoint
DROP TABLE `projects_to_subscribers`;--> statement-breakpoint
ALTER TABLE `__new_projects_to_subscribers` RENAME TO `projects_to_subscribers`;--> statement-breakpoint
CREATE TABLE `__new_highlights` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`type` text DEFAULT 'highlight' NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`text` text NOT NULL,
	`position` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_highlights`("id", "note_id", "type", "author_id", "created_at", "text", "position") SELECT "id", "note_id", "type", "author_id", "created_at", "text", "position" FROM `highlights`;--> statement-breakpoint
DROP TABLE `highlights`;--> statement-breakpoint
ALTER TABLE `__new_highlights` RENAME TO `highlights`;--> statement-breakpoint
CREATE TABLE `__new_images` (
	`id` text PRIMARY KEY NOT NULL,
	`note_id` text NOT NULL,
	`type` text DEFAULT 'image' NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`image_url` text NOT NULL,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_images`("id", "note_id", "type", "author_id", "created_at", "image_url") SELECT "id", "note_id", "type", "author_id", "created_at", "image_url" FROM `images`;--> statement-breakpoint
DROP TABLE `images`;--> statement-breakpoint
ALTER TABLE `__new_images` RENAME TO `images`;--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`author_id` text NOT NULL,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`content_lexical` text,
	`content_html` text,
	`url` text,
	`description` text,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "type", "author_id", "is_public", "created_at", "title", "content", "content_lexical", "content_html", "url", "description") SELECT "id", "type", "author_id", "is_public", "created_at", "title", "content", "content_lexical", "content_html", "url", "description" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_public` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "author_id", "name", "description", "is_public", "created_at") SELECT "id", "author_id", "name", "description", "is_public", "created_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;