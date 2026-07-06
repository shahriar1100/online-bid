CREATE TABLE `listing_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`answer` text NOT NULL,
	`is_best_answer` integer DEFAULT false NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`is_edited` integer DEFAULT false NOT NULL,
	`edited_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `listing_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `listing_answers_question_idx` ON `listing_answers` (`question_id`);--> statement-breakpoint
CREATE INDEX `listing_answers_listing_idx` ON `listing_answers` (`listing_id`,`listing_type`);--> statement-breakpoint
CREATE INDEX `listing_answers_user_idx` ON `listing_answers` (`user_id`);--> statement-breakpoint
CREATE TABLE `listing_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`listing_id` integer NOT NULL,
	`listing_type` text NOT NULL,
	`user_id` integer NOT NULL,
	`question` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`is_pinned` integer DEFAULT false NOT NULL,
	`total_answers` integer DEFAULT 0 NOT NULL,
	`last_answer_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `listing_questions_listing_idx` ON `listing_questions` (`listing_id`,`listing_type`);--> statement-breakpoint
CREATE INDEX `listing_questions_user_idx` ON `listing_questions` (`user_id`);--> statement-breakpoint
CREATE INDEX `listing_questions_status_idx` ON `listing_questions` (`status`);