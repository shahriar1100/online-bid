PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_auction_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`start_time` integer,
	`end_time` integer,
	`status` text DEFAULT 'upcoming',
	`starting_price` real NOT NULL,
	`current_bid` real,
	`winner_user_id` integer,
	`winning_bid` real,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
INSERT INTO `__new_auction_sessions`("id", "listing_id", "listing_type", "start_time", "end_time", "status", "starting_price", "current_bid", "winner_user_id", "winning_bid", "created_at", "updated_at") SELECT "id", "listing_id", "listing_type", "start_time", "end_time", "status", "starting_price", "current_bid", "winner_user_id", "winning_bid", "created_at", "updated_at" FROM `auction_sessions`;--> statement-breakpoint
DROP TABLE `auction_sessions`;--> statement-breakpoint
ALTER TABLE `__new_auction_sessions` RENAME TO `auction_sessions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_bids` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`user_id` integer NOT NULL,
	`user_name` text NOT NULL,
	`user_avatar` text,
	`bid_amount` real NOT NULL,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
INSERT INTO `__new_bids`("id", "listing_id", "listing_type", "user_id", "user_name", "user_avatar", "bid_amount", "created_at") SELECT "id", "listing_id", "listing_type", "user_id", "user_name", "user_avatar", "bid_amount", "created_at" FROM `bids`;--> statement-breakpoint
DROP TABLE `bids`;--> statement-breakpoint
ALTER TABLE `__new_bids` RENAME TO `bids`;