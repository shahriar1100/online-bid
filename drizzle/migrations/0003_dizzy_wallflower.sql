CREATE TABLE `auction_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`start_time` integer,
	`end_time` integer,
	`status` text DEFAULT 'upcoming',
	`starting_price` text NOT NULL,
	`current_bid` text,
	`winner_user_id` integer,
	`winning_bid` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text NOT NULL,
	`user_avatar` text,
	`bid_amount` text NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
ALTER TABLE `real_estate_listings` ADD `monthly` text;