/**
 * useResourceScheduler — Vue composable wrapping the ResourceScheduler service.
 *
 * Provides reactive state that components can watch, plus lifecycle-aware
 * operation management and automatic route-change detection.
 *
 * Usage:
 *   const { currentOperation, profile, beginOperation, endOperation } = useResourceScheduler()
 *   beginOperation('loading-archives', { totalItems: 100 })
 *   // ... work ...
 *   endOperation('loading-archives')
 */

import { ref, onUnmounted, type Ref } from "vue";
import { useRouter } from "vue-router";
import scheduler from "@/services/resourceScheduler";
import type {
  OperationType,
  OperationPriority,
  ResourceProfile,
  SchedulerState,
  OperationContext,
  PredictionState,
} from "@/types";

export interface UseResourceSchedulerReturn {
  /** Current dominant operation type */
  currentOperation: Ref<OperationType>;
  /** Current dominant operation priority */
  currentPriority: Ref<OperationPriority>;
  /** Current computed resource profile */
  profile: Ref<ResourceProfile>;
  /** Number of concurrently active operations */
  activeOperationsCount: Ref<number>;
  /** Current FPS */
  currentFps: Ref<number>;
  /** Whether the system is overloaded */
  isOverloaded: Ref<boolean>;
  /** Number of pending background tasks */
  pendingTasks: Ref<number>;
  /** Scheduler snapshot (raw) */
  state: Ref<SchedulerState>;

  /** Begin an operation */
  beginOperation: (type: OperationType, metadata?: OperationContext["metadata"]) => void;
  /** End an operation */
  endOperation: (type: OperationType) => void;
  /** Update operation metadata */
  updateOperation: (type: OperationType, metadata: OperationContext["metadata"]) => void;
  /** Run a synchronous operation under context */
  runOperation: <T>(type: OperationType, fn: () => T, metadata?: OperationContext["metadata"]) => T;
  /** Run an async operation under context */
  runAsyncOperation: <T>(
    type: OperationType,
    fn: () => Promise<T>,
    metadata?: OperationContext["metadata"],
  ) => Promise<T>;
  /** Schedule a background task */
  scheduleTask: (task: {
    id: string;
    label: string;
    priority: OperationPriority;
    fn: () => Promise<void> | void;
    timeBudget?: number;
    persistent?: boolean;
  }) => void;
  /** Get the animation quality from the current profile */
  getAnimationQuality: () => ResourceProfile["animationQuality"];
  /** Feed FPS data to the scheduler */
  feedFps: (fps: number) => void;
  /** Feed memory data to the scheduler */
  feedMemory: (mb: number) => void;

  // ─── Predictive Scheduling ──────────────────────────
  /** Predict a future operation and pre-allocate resources */
  predict: (type: OperationType, options?: { source?: string; leadTime?: number; confidence?: number }) => void;
  /** Cancel an active prediction */
  cancelPrediction: () => void;
  /** Pre-warm resources for an operation */
  prewarm: (type: OperationType) => void;
  /** Current prediction state */
  predictionState: Ref<PredictionState>;
  /** Whether a specific operation type is predicted */
  isPredicted: (type: OperationType) => boolean;
}

/**
 * Vue composable for the resource scheduler.
 * Creates reactive state bound to the scheduler singleton.
 */
export function useResourceScheduler(): UseResourceSchedulerReturn {
  const initial = scheduler.state;

  const currentOperation = ref<OperationType>(initial.currentOperation);
  const currentPriority = ref<OperationPriority>(initial.currentPriority);
  const profile = ref<ResourceProfile>({ ...initial.resourceProfile });
  const activeOperationsCount = ref(initial.activeOperationsCount);
  const currentFps = ref(initial.currentFps);
  const isOverloaded = ref(initial.isOverloaded);
  const pendingTasks = ref(initial.pendingTasks);
  const state = ref<SchedulerState>({ ...initial });
  const predictionState = ref<PredictionState>(initial.prediction ?? { active: null, phase: "idle" });

  // Subscribe to scheduler state changes
  const unsubscribe = scheduler.onStateChange((newState) => {
    currentOperation.value = newState.currentOperation;
    currentPriority.value = newState.currentPriority;
    profile.value = { ...newState.resourceProfile };
    activeOperationsCount.value = newState.activeOperationsCount;
    currentFps.value = newState.currentFps;
    isOverloaded.value = newState.isOverloaded;
    pendingTasks.value = newState.pendingTasks;
    predictionState.value = newState.prediction;
    state.value = { ...newState };
  });

  // Auto-detect route navigation
  const router = useRouter();
  const removeGuard = router.beforeEach((_to, _from) => {
    scheduler.beginOperation("navigating");
  });
  const removeAfterEach = router.afterEach((_to, _from) => {
    scheduler.endOperation("navigating");
  });

  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribe();
    removeGuard();
    removeAfterEach();
  });

  const beginOperation = (type: OperationType, metadata?: OperationContext["metadata"]) =>
    scheduler.beginOperation(type, metadata);

  const endOperation = (type: OperationType) => scheduler.endOperation(type);

  const updateOperation = (type: OperationType, metadata: OperationContext["metadata"]) =>
    scheduler.updateOperation(type, metadata);

  const runOperation = <T>(type: OperationType, fn: () => T, metadata?: OperationContext["metadata"]) =>
    scheduler.runOperation(type, fn, metadata);

  const runAsyncOperation = <T>(type: OperationType, fn: () => Promise<T>, metadata?: OperationContext["metadata"]) =>
    scheduler.runAsyncOperation(type, fn, metadata);

  const scheduleTask = (task: {
    id: string;
    label: string;
    priority: OperationPriority;
    fn: () => Promise<void> | void;
    timeBudget?: number;
    persistent?: boolean;
  }) =>
    scheduler.scheduleTask({
      ...task,
      timeBudget: task.timeBudget ?? 8,
      persistent: task.persistent ?? false,
    });

  const getAnimationQuality = () => scheduler.getAnimationQuality();

  const feedFps = (fps: number) => scheduler.feedFps(fps);

  const feedMemory = (mb: number) => scheduler.feedMemory(mb);

  // ─── Predictive Scheduling ──────────────────────────
  const predict = (type: OperationType, options?: { source?: string; leadTime?: number; confidence?: number }) =>
    scheduler.predict(type, options);

  const cancelPrediction = () => scheduler.cancelPrediction();

  const prewarm = (type: OperationType) => scheduler.prewarm(type);

  const isPredicted = (type: OperationType) => scheduler.isPredicted(type);

  return {
    currentOperation,
    currentPriority,
    profile,
    activeOperationsCount,
    currentFps,
    isOverloaded,
    pendingTasks,
    state,
    beginOperation,
    endOperation,
    updateOperation,
    runOperation,
    runAsyncOperation,
    scheduleTask,
    getAnimationQuality,
    feedFps,
    feedMemory,
    predict,
    cancelPrediction,
    prewarm,
    predictionState,
    isPredicted,
  };
}

/**
 * Direct scheduler access (without Vue reactivity).
 * Use this in non-component code (services, utilities).
 */
export { scheduler };
