CREATE TABLE `auction_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`winning_bid` real NOT NULL,
	`upfront_payment` real NOT NULL,
	`platform_fee` real NOT NULL,
	`total_amount` real NOT NULL,
	`stripe_session_id` text,
	`stripe_payment_intent` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`completed_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auction_payments_stripe_session_id_unique` ON `auction_payments` (`stripe_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_user_listing_payment` ON `auction_payments` (`user_id`,`listing_id`,`listing_type`);