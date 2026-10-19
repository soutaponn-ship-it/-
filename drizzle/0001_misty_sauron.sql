CREATE TABLE `study_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`payload` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `study_data_id` PRIMARY KEY(`id`),
	CONSTRAINT `study_data_user_id_unique` UNIQUE(`userId`)
);
