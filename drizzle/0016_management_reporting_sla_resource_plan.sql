CREATE TABLE IF NOT EXISTS `management_daily_reports` (
  `id` int AUTO_INCREMENT NOT NULL,
  `reportDate` date NOT NULL,
  `shiftName` varchar(120) NOT NULL,
  `areaCode` varchar(80),
  `projectId` varchar(40),
  `progressSummary` text NOT NULL,
  `completedCount` int NOT NULL DEFAULT 0,
  `inProgressCount` int NOT NULL DEFAULT 0,
  `overdueCount` int NOT NULL DEFAULT 0,
  `safetyHighlights` text,
  `nextPlan` text,
  `createdByOpenId` varchar(64),
  `createdByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `management_daily_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `resource_plan_entries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` varchar(40),
  `areaCode` varchar(80),
  `resourceType` varchar(80) NOT NULL,
  `resourceName` varchar(200) NOT NULL,
  `requiredQty` int NOT NULL DEFAULT 0,
  `availableQty` int NOT NULL DEFAULT 0,
  `unit` varchar(40) NOT NULL DEFAULT 'each',
  `shiftName` varchar(120),
  `needDate` date,
  `status` varchar(80) NOT NULL DEFAULT 'Planned',
  `notes` text,
  `createdByOpenId` varchar(64),
  `createdByName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `resource_plan_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sla_rule_settings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `phase` enum('Broken / Preparation','Assembly','Tight & Torque','Final Tight','Inspection Ready') NOT NULL,
  `priority` varchar(40) NOT NULL DEFAULT 'All',
  `targetHours` int NOT NULL DEFAULT 24,
  `escalationRole` varchar(120),
  `escalationAfterHours` int NOT NULL DEFAULT 4,
  `isActive` int NOT NULL DEFAULT 1,
  `updatedByOpenId` varchar(64),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `sla_rule_settings_id` PRIMARY KEY(`id`),
  CONSTRAINT `sla_rule_phase_priority_unique` UNIQUE(`phase`,`priority`)
);
