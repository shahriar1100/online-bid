ALTER TABLE `real_estate_listings` ADD `parking_spaces` text;--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_auction_session_listing` ON `auction_sessions` (`listing_id`,`listing_type`);