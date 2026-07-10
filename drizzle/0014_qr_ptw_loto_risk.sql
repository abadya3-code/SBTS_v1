CREATE TABLE IF NOT EXISTS `qr_blind_tokens` (
  `token` varchar(96) NOT NULL,
  `blindTag` varchar(40) NOT NULL,
  `projectId` varchar(40) NOT NULL,
  `accessMode` varchar(40) NOT NULL DEFAULT 'field_readonly',
  `expiresAt` timestamp NULL,
  `isActive` int NOT NULL DEFAULT 1,
  `scanCount` int NOT NULL DEFAULT 0,
  `lastScannedAt` timestamp NULL,
  `createdByOpenId` varchar(64),
  `createdByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `qr_blind_tokens_token` PRIMARY KEY(`token`),
  CONSTRAINT `project_blind_token_unique` UNIQUE(`projectId`, `blindTag`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `qr_scan_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `token` varchar(96) NOT NULL,
  `blindTag` varchar(40),
  `projectId` varchar(40),
  `result` varchar(80) NOT NULL DEFAULT 'unknown',
  `ipAddress` varchar(80),
  `userAgent` varchar(500),
  `scannedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `qr_scan_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `blind_risk_assessments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `blindTag` varchar(40) NOT NULL,
  `projectId` varchar(40) NOT NULL,
  `phase` enum('Broken / Preparation','Assembly','Tight & Torque','Final Tight','Inspection Ready') NOT NULL DEFAULT 'Broken / Preparation',
  `riskLevel` varchar(40) NOT NULL DEFAULT 'Medium',
  `residualRisk` varchar(40) NOT NULL DEFAULT 'Medium',
  `hazardsJson` text NOT NULL,
  `controlsJson` text NOT NULL,
  `status` varchar(40) NOT NULL DEFAULT 'draft',
  `assessorName` varchar(200),
  `createdByOpenId` varchar(64),
  `createdByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `blind_risk_assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `blind_ptw_loto_records` (
  `id` int AUTO_INCREMENT NOT NULL,
  `blindTag` varchar(40) NOT NULL,
  `projectId` varchar(40) NOT NULL,
  `phase` enum('Broken / Preparation','Assembly','Tight & Torque','Final Tight','Inspection Ready') NOT NULL DEFAULT 'Broken / Preparation',
  `ptwNumber` varchar(120),
  `lotoNumber` varchar(120),
  `permitStatus` varchar(80) NOT NULL DEFAULT 'Pending',
  `isolationStatus` varchar(80) NOT NULL DEFAULT 'Not verified',
  `energySourcesJson` text,
  `gasTestRequired` int NOT NULL DEFAULT 0,
  `gasTestResult` varchar(120),
  `verifierName` varchar(200),
  `expiresAt` timestamp NULL,
  `createdByOpenId` varchar(64),
  `createdByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `blind_ptw_loto_records_id` PRIMARY KEY(`id`)
);
