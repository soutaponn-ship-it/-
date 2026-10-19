CREATE TABLE `parent_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`parentId` int,
	`inviteCode` varchar(16) NOT NULL,
	`status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
	`sharePlan` int NOT NULL DEFAULT 1,
	`shareStudy` int NOT NULL DEFAULT 1,
	`shareScores` int NOT NULL DEFAULT 1,
	`shareWeaknesses` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parent_links_id` PRIMARY KEY(`id`),
	CONSTRAINT `parent_links_inviteCode_unique` UNIQUE(`inviteCode`)
);
