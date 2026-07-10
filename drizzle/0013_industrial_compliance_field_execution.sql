CREATE TABLE `blind_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindTag` varchar(40) NOT NULL,
	`projectId` varchar(40) NOT NULL,
	`phase` enum('Broken / Preparation','Assembly','Tight & Torque','Final Tight','Inspection Ready') NOT NULL,
	`evidenceType` varchar(80) NOT NULL DEFAULT 'photo',
	`fileName` varchar(255),
	`mimeType` varchar(120),
	`dataUrl` text,
	`caption` text,
	`uploadedByOpenId` varchar(64),
	`uploadedByName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blind_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blind_safety_checklists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindTag` varchar(40) NOT NULL,
	`projectId` varchar(40) NOT NULL,
	`phase` enum('Broken / Preparation','Assembly','Tight & Torque','Final Tight','Inspection Ready') NOT NULL,
	`checklistJson` text NOT NULL,
	`status` varchar(40) NOT NULL DEFAULT 'draft',
	`completedByOpenId` varchar(64),
	`completedByName` varchar(200),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blind_safety_checklists_id` PRIMARY KEY(`id`),
	CONSTRAINT `blind_phase_checklist_unique` UNIQUE(`blindTag`,`projectId`,`phase`)
);
--> statement-breakpoint
CREATE TABLE `blind_torque_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindTag` varchar(40) NOT NULL,
	`projectId` varchar(40) NOT NULL,
	`phase` enum('Broken / Preparation','Assembly','Tight & Torque','Final Tight','Inspection Ready') NOT NULL DEFAULT 'Tight & Torque',
	`boltNo` varchar(40),
	`boltSize` varchar(80),
	`torqueValue` varchar(80) NOT NULL,
	`torqueUnit` varchar(40) NOT NULL DEFAULT 'Nm',
	`toolId` varchar(120),
	`technicianName` varchar(200),
	`verifiedByName` varchar(200),
	`notes` text,
	`createdByOpenId` varchar(64),
	`createdByName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blind_torque_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `blind_inspection_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blindTag` varchar(40) NOT NULL,
	`projectId` varchar(40) NOT NULL,
	`recordType` varchar(80) NOT NULL,
	`referenceNo` varchar(160),
	`result` varchar(80) NOT NULL DEFAULT 'Pending',
	`description` text,
	`fileName` varchar(255),
	`mimeType` varchar(120),
	`dataUrl` text,
	`createdByOpenId` varchar(64),
	`createdByName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blind_inspection_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blind_evidence` ADD CONSTRAINT `blind_evidence_blindTag_blinds_tag_fk` FOREIGN KEY (`blindTag`) REFERENCES `blinds`(`tag`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_evidence` ADD CONSTRAINT `blind_evidence_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_safety_checklists` ADD CONSTRAINT `blind_safety_checklists_blindTag_blinds_tag_fk` FOREIGN KEY (`blindTag`) REFERENCES `blinds`(`tag`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_safety_checklists` ADD CONSTRAINT `blind_safety_checklists_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_torque_records` ADD CONSTRAINT `blind_torque_records_blindTag_blinds_tag_fk` FOREIGN KEY (`blindTag`) REFERENCES `blinds`(`tag`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_torque_records` ADD CONSTRAINT `blind_torque_records_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_inspection_records` ADD CONSTRAINT `blind_inspection_records_blindTag_blinds_tag_fk` FOREIGN KEY (`blindTag`) REFERENCES `blinds`(`tag`) ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `blind_inspection_records` ADD CONSTRAINT `blind_inspection_records_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;
