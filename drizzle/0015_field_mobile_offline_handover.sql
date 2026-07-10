CREATE TABLE IF NOT EXISTS `field_offline_drafts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `draftId` varchar(96) NOT NULL,
  `projectId` varchar(40),
  `blindTag` varchar(40),
  `draftType` varchar(80) NOT NULL,
  `payloadJson` text NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'queued',
  `deviceId` varchar(160),
  `clientCreatedAt` timestamp NULL,
  `syncedByOpenId` varchar(64),
  `syncedByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `field_offline_drafts_id` PRIMARY KEY(`id`),
  CONSTRAINT `field_offline_drafts_draftId_unique` UNIQUE(`draftId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `shift_handover_records` (
  `id` int AUTO_INCREMENT NOT NULL,
  `shiftDate` date NOT NULL,
  `shiftName` varchar(120) NOT NULL,
  `areaCode` varchar(80),
  `projectId` varchar(40),
  `summary` text NOT NULL,
  `openRisksJson` text,
  `prioritiesJson` text,
  `handoverToName` varchar(200),
  `createdByOpenId` varchar(64),
  `createdByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `shift_handover_records_id` PRIMARY KEY(`id`)
);
