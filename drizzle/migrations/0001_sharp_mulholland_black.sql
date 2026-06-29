ALTER TABLE `automobile_listings` ADD `is_featured` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `automobile_listings` ADD `featured_until` integer;--> statement-breakpoint
ALTER TABLE `business_listings` ADD `is_featured` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `business_listings` ADD `featured_until` integer;--> statement-breakpoint
ALTER TABLE `real_estate_listings` ADD `is_featured` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `real_estate_listings` ADD `featured_until` integer;