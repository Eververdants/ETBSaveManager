/**
 * Domain Models - Archive
 * Core business entities for archive management
 */

export interface Archive {
  id: number;
  name: string;
  difficulty: string;
  actualDifficulty: string;
  mode: string;
  date: string;
  currentLevel: string;
  hidden: boolean;
  path: string;
  isVisible?: boolean;
}

export interface ArchiveMetadata {
  id: number;
  name: string;
  difficulty: string;
  mode: string;
  date: string;
  hidden: boolean;
  path: string;
  isVisible?: boolean;
  fileSize: number;
}

export interface ArchiveDetail {
  path: string;
  currentLevel: string;
  actualDifficulty: string;
}

export interface ArchiveConfig {
  id: string;
  name: string;
  parsedInfo: {
    level?: string;
    difficulty?: string;
    mode?: string;
  };
  level: string | null;
  difficulty: string | null;
  actualDifficulty: string | null;
  inventoryTemplate: unknown[] | null;
  finalLevel: string | null;
  finalDifficulty: string | null;
  finalActualDifficulty: string | null;
  finalInventory: unknown[];
  hasIndividualSettings: boolean;
  validationErrors: string[];
}

export interface CreateArchiveOptions {
  archiveName: string;
  level: string;
  gameMode: string;
  difficulty: string;
  actualDifficulty: string;
  players: unknown[];
  basicArchive: Record<string, unknown>;
  mainEnding: boolean;
  megUnlocked: boolean;
}
