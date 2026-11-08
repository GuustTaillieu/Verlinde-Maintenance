CREATE TABLE IF NOT EXISTS `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `articles` (
	`code` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`unit` text DEFAULT 'st',
	`category` text,
	`supplier_code` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'RESIDENTIAL' NOT NULL,
	`vat_number` text,
	`email` text,
	`phone` text,
	`mobile` text,
	`invoice_address` text,
	`invoice_city` text DEFAULT 'Zwevegem',
	`invoice_zip` text,
	`notes` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `customers_code_unique` ON `customers` (`code`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `equipment` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`article_code` text NOT NULL,
	`description` text NOT NULL,
	`location` text,
	`serial_number` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`install_date` text NOT NULL,
	`maintenance_interval_months` integer DEFAULT 12 NOT NULL,
	`last_service_date` text,
	`next_due_date` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sites` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`sheet_number` text NOT NULL,
	`name` text NOT NULL,
	`site_address` text NOT NULL,
	`site_city` text NOT NULL,
	`site_zip` text,
	`primary_discipline` text DEFAULT 'INTRUSION' NOT NULL,
	`access_notes_confidential` text,
	`is_active` integer DEFAULT true NOT NULL,
	`install_date` text,
	`frequency` text DEFAULT '1J',
	`last_service_date` text,
	`next_due_date` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `sites_sheet_number_unique` ON `sites` (`sheet_number`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role` text DEFAULT 'TECHNICIAN' NOT NULL,
	`is_contractor` integer DEFAULT false NOT NULL,
	`tech_code` text,
	`initials` text,
	`title` text,
	`specialties` text DEFAULT '[]',
	`weekly_schedule` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `work_order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`work_order_id` text NOT NULL,
	`equipment_id` text,
	`article_code` text,
	`description` text NOT NULL,
	`quantity` real DEFAULT 1 NOT NULL,
	`is_checked` integer DEFAULT false NOT NULL,
	`tech_remarks` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`equipment_id`) REFERENCES `equipment`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `work_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`wo_number` text NOT NULL,
	`customer_id` text,
	`site_id` text,
	`assigned_technician_id` text,
	`status` text DEFAULT 'UNASSIGNED' NOT NULL,
	`kind` text DEFAULT 'MAINTENANCE' NOT NULL,
	`planned_date` text,
	`planned_start_time` text,
	`planned_end_time` text,
	`description` text,
	`site_address` text,
	`office_notes` text,
	`tech_notes` text,
	`certificate_document` text,
	`is_signed` integer DEFAULT false NOT NULL,
	`signed_by_name` text,
	`signed_at` text,
	`completed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`assigned_technician_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `work_orders_wo_number_unique` ON `work_orders` (`wo_number`);