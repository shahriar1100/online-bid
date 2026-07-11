CREATE TABLE `chat_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`sender_id` integer NOT NULL,
	`receiver_id` integer NOT NULL,
	`message` text,
	`message_type` text DEFAULT 'text' NOT NULL,
	`attachment_url` text,
	`attachment_name` text,
	`attachment_size` integer,
	`reply_to_message_id` integer,
	`edited_at` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_chat_messages_room_id` ON `chat_messages` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_sender_id` ON `chat_messages` (`sender_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_receiver_id` ON `chat_messages` (`receiver_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_created_at` ON `chat_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_chat_messages_room_created_at` ON `chat_messages` (`room_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `chat_participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	`last_seen_at` integer,
	`unread_count` integer DEFAULT 0 NOT NULL,
	`is_muted` integer DEFAULT false NOT NULL,
	`is_blocked` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `chat_rooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_chat_participants_room_user` ON `chat_participants` (`room_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_participants_room_id` ON `chat_participants` (`room_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_participants_user_id` ON `chat_participants` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_participants_role` ON `chat_participants` (`role`);--> statement-breakpoint
CREATE INDEX `idx_chat_participants_is_active` ON `chat_participants` (`is_active`);--> statement-breakpoint
CREATE TABLE `chat_rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`buyer_id` integer NOT NULL,
	`seller_id` integer NOT NULL,
	`payment_required` integer DEFAULT false NOT NULL,
	`payment_completed` integer DEFAULT false NOT NULL,
	`stripe_payment_id` text,
	`room_status` text DEFAULT 'pending' NOT NULL,
	`last_message_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uidx_buyer_seller_listing` ON `chat_rooms` (`buyer_id`,`seller_id`,`listing_id`,`listing_type`);--> statement-breakpoint
CREATE INDEX `idx_chat_rooms_buyer` ON `chat_rooms` (`buyer_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_rooms_seller` ON `chat_rooms` (`seller_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_rooms_listing` ON `chat_rooms` (`listing_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_rooms_status` ON `chat_rooms` (`room_status`);--> statement-breakpoint
CREATE INDEX `idx_last_message` ON `chat_rooms` (`last_message_at`);