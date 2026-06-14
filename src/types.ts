export interface ParsedNameInfo {
  originalName: string;
  index: number | null;
  levelKeyword: string | null;
  levelValue: string | null;
  difficultyKeyword: string | null;
  difficultyValue: string | null;
  backpackKeyword: string | null;
  backpackValue: string | null;
  highlights: NameHighlight[];
}

export interface NameHighlight {
  start: number;
  end: number;
  type: "index" | "level" | "difficulty";
  color: "blue" | "orange";
}

export interface ParsedRecord {
  name: string;
  level: string | null;
  difficulty: string | null;
  actualDifficulty: string | null;
  backpack: string | null;
  parsed: ParsedNameInfo;
  warnings: string[];
}

export interface ParseResult {
  records: ParsedRecord[];
  errors: string[];
  warnings: string[];
  info: string[];
  stats: {
    total: number;
    levelDetected: number;
    difficultyDetected: number;
    duplicates: number;
  };
}

export type DifficultyLevel = "easy" | "normal" | "hard" | "nightmare";

export type ConfigSource = "individual" | "smart" | "uniform" | "default";

export interface UniformConfig {
  level: { enabled: boolean; value: string | null };
  difficulty: { enabled: boolean; value: DifficultyLevel | null };
  actualDifficulty: { enabled: boolean; value: DifficultyLevel | null };
  inventory: { enabled: boolean; templateName: string | null };
}

export interface SmartRules {
  autoAssignLevel: boolean;
  autoDetectDifficulty: boolean;
  autoRenameDuplicates: boolean;
}

export interface ArchiveConfig {
  id: string;
  name: string;
  parsedInfo: ParsedNameInfo;
  level: string | null;
  difficulty: DifficultyLevel | null;
  actualDifficulty: DifficultyLevel | null;
  inventoryTemplate: string | null;
  finalLevel: string | null;
  finalDifficulty: DifficultyLevel | null;
  finalActualDifficulty: DifficultyLevel | null;
  finalInventory: unknown[];
  hasIndividualSettings: boolean;
  validationErrors: string[];
}

export interface ResolvedConfig {
  level: string | null;
  difficulty: DifficultyLevel;
  actualDifficulty: DifficultyLevel;
  inventoryTemplate: string | null;
  source: {
    level: ConfigSource;
    difficulty: ConfigSource;
    actualDifficulty: ConfigSource;
    inventory: ConfigSource;
  };
}

export interface ValidationError {
  archiveId: string;
  field: string;
  message: string;
  type: "empty_name" | "missing_level" | "duplicate_name";
}

export interface ValidationWarning {
  archiveId: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ArchiveData {
  id: number;
  name: string;
  currentLevel: string;
  gameMode: string;
  archiveDifficulty: string;
  actualDifficulty: string;
  isVisible: boolean;
  path: string;
  date: string;
}

export interface MenuConfig {
  id: number;
  textKey: string;
  icon: [string, string];
  action: string;
  descriptionKey: string;
  route: string;
}

export interface ToastOptions {
  actions?: Array<{ text: string; onClick: (id: string) => void }>;
  position?: string;
  duration?: number;
  icon?: [string, string];
  type?: string;
}

export interface PopupOptions {
  message: string;
  type?: string;
  icon?: [string, string];
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface NotificationOptions {
  message: string;
  type?: string;
  position?: string;
  duration?: number;
  icon?: [string, string];
  actions?: Array<{ text: string; onClick: (id: string) => void }>;
}

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
  downloadUrl: string;
  directDownloadUrl: string;
  prerelease: boolean;
  shouldUpdate: boolean;
  source: string;
}

export interface UpdateSourceConfig {
  name: string;
  description: string;
  apiUrl: string;
  releasesUrl: string;
  enabled: boolean;
}

export interface PluginData {
  id: string;
  name: string;
  version?: string;
  description?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LogEntry {
  id: number;
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: string;
  date: Date;
}

export interface DevicePerformanceInfo {
  cpuCores: number;
  deviceMemory: number;
  isMobile: boolean;
  isLowEndDevice: boolean;
  isVeryLowEndDevice: boolean;
  prefersReducedMotion: boolean;
  performanceScore: number;
  performanceLevel: "high" | "medium" | "low";
}

export interface PerformanceMonitorOptions {
  longTaskThreshold?: number;
  fpsThreshold?: number;
  longTaskLimit?: number;
  lowFpsLimit?: number;
  onLowPerformance?: () => void;
  onPerformanceRecovery?: () => void;
  onFPSUpdate?: (fps: number) => void;
}

export interface AnimationParams {
  duration: number;
  ease: string;
  delay: number;
  force3D: boolean;
  stagger?: number;
}

export interface QuickCreateBatchResult {
  success: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
  lastCreatedName?: string | null;
}

export interface BatchDeleteResult {
  success: string[];
  failed: Array<{ id: string; error: unknown }>;
}

export interface UndoAction {
  description: string;
  undo: () => Promise<void>;
  redo?: () => Promise<void>;
}

// Type for vue-i18n translation function
export type TranslateFn = (key: string, ...args: unknown[]) => string;
