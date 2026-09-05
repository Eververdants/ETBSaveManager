/**
 * Resource Scheduler types
 * Types for the intelligent resource scheduler that dynamically allocates
 * CPU, rendering, and memory resources based on operation context.
 */

/** Operation priority levels for resource scheduling */
export type OperationPriority = "critical" | "high" | "medium" | "low" | "idle";

/** Recognized operation types the scheduler can detect */
export type OperationType =
  | "loading-archives"
  | "batch-creating"
  | "searching"
  | "animating"
  | "navigating"
  | "rendering"
  | "editing"
  | "previewing"
  | "interacting"
  | "idle"
  | "background";

/** A detected operation context */
export interface OperationContext {
  type: OperationType;
  priority: OperationPriority;
  label: string;
  startedAt: number;
  /** Optional metadata for richer scheduling decisions */
  metadata?: {
    /** Estimated progress 0-100 */
    progress?: number;
    /** Total items being processed */
    totalItems?: number;
    /** Items completed */
    completedItems?: number;
  };
}

/** Resource allocation profile for an operation */
export interface ResourceProfile {
  /** Animation frame CPU budget factor (0-1). 1 = full budget */
  cpuBudget: number;
  /** Animation quality level */
  animationQuality: "high" | "medium" | "low" | "disabled";
  /** Whether to prioritize DOM/rendering updates */
  renderPriority: boolean;
  /** Memory management: aggressive vs conservative GC */
  gcStrategy: "aggressive" | "normal" | "conservative";
  /** Background task deferral: minimum idle ms before running bg tasks */
  backgroundTaskThreshold: number;
  /** Whether to throttle non-critical event handlers */
  throttleInput: boolean;
  /** Virtual scroll / list optimization level */
  virtualizationLevel: "full" | "reduced" | "minimal";
}

/** A deferrable background task */
export interface ScheduledTask {
  id: string;
  label: string;
  priority: OperationPriority;
  fn: () => Promise<void> | void;
  /** Max time in ms this task can run per cycle before yielding */
  timeBudget: number;
  /** Whether this task must eventually run even if always deferred */
  persistent: boolean;
}

/** Resource scheduler state snapshot */
export interface SchedulerState {
  currentOperation: OperationType;
  currentPriority: OperationPriority;
  resourceProfile: ResourceProfile;
  activeOperationsCount: number;
  /** Current FPS (from performance monitor) */
  currentFps: number;
  /** Current memory usage MB */
  currentMemoryMb: number;
  /** Whether the system is overloaded */
  isOverloaded: boolean;
  /** Number of pending background tasks */
  pendingTasks: number;
  /** Active prediction (null if none) */
  prediction: PredictionState;
}

/** A prediction about a future operation — enables proactive resource allocation */
export interface Prediction {
  /** The operation type expected to start */
  type: OperationType;
  /** Confidence level 0-1 (0.7+ = commit resources immediately) */
  confidence: number;
  /** Estimated ms until the operation starts (default 300) */
  leadTime: number;
  /** When the prediction was registered */
  createdAt: number;
  /** Human-readable label for what triggered this prediction */
  source: string;
}

/** Resource scheduler prediction snapshot */
export interface PredictionState {
  active: Prediction | null;
  phase: "idle" | "preparing" | "committed";
}
