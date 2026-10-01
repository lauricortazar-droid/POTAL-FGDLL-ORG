CREATE TABLE `ack_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`user_email` text NOT NULL,
	`user_id` text NOT NULL,
	`full_name` text NOT NULL,
	`group_name` text NOT NULL,
	`service_role` text NOT NULL,
	`zone` text NOT NULL,
	`assigned_at` text NOT NULL,
	`opened_at` text,
	`progress` integer DEFAULT 0 NOT NULL,
	`follow_up` text DEFAULT '' NOT NULL,
	`carried_from` text,
	FOREIGN KEY (`version_id`) REFERENCES `ack_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ack_assignment_user_idx` ON `ack_assignments` (`version_id`,`user_email`);--> statement-breakpoint
CREATE INDEX `ack_assignment_email_idx` ON `ack_assignments` (`user_email`);--> statement-breakpoint
CREATE TABLE `ack_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`zone` text NOT NULL,
	`category` text NOT NULL,
	`meeting_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`latest_version_id` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ack_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version` text NOT NULL,
	`title` text NOT NULL,
	`zone` text NOT NULL,
	`category` text NOT NULL,
	`meeting_date` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`due_at` text,
	`requires_new` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `ack_documents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ack_version_number_idx` ON `ack_versions` (`document_id`,`version`);--> statement-breakpoint
CREATE TABLE `acknowledgements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` text NOT NULL,
	`folio` text NOT NULL,
	`user_id` text NOT NULL,
	`full_name` text NOT NULL,
	`group_name` text NOT NULL,
	`service_role` text NOT NULL,
	`zone` text NOT NULL,
	`signature_key` text NOT NULL,
	`confirmed_at` text NOT NULL,
	`statement` text NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `ack_assignments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ack_receipt_assignment_idx` ON `acknowledgements` (`assignment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ack_receipt_folio_idx` ON `acknowledgements` (`folio`);