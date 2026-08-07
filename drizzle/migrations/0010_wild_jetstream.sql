ALTER TABLE `auction_payments` ADD `invoice_number` text;--> statement-breakpoint
ALTER TABLE `auction_payments` ADD `invoice_status` text DEFAULT 'generated';--> statement-breakpoint
ALTER TABLE `auction_payments` ADD `invoice_generated_at` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `auction_payments_invoice_number_unique` ON `auction_payments` (`invoice_number`);