ALTER TABLE `notes_table` RENAME TO `notes`;--> statement-breakpoint
CREATE TABLE `annotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sourceId` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `web_annotations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`link` text NOT NULL,
	`authorsNote` text
);
