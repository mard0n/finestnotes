PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects_to_notes` (
	`project_id` text NOT NULL,
	`note_id` text NOT NULL,
	PRIMARY KEY(`project_id`, `note_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade
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
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_projects_to_subscribers`("project_id", "author_id") SELECT "project_id", "author_id" FROM `projects_to_subscribers`;--> statement-breakpoint
DROP TABLE `projects_to_subscribers`;--> statement-breakpoint
ALTER TABLE `__new_projects_to_subscribers` RENAME TO `projects_to_subscribers`;