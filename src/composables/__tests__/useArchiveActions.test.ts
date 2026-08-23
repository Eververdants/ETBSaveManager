// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";

// ─── Mocks (hoisted) ─────────────────────────────────────────────

const toggleMock = vi.fn();
const softDeleteMock = vi.fn();
const restoreMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("../useToast", () => {
  const toast = {
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    showWarn: vi.fn(),
  };
  return { useToast: () => toast };
});

vi.mock("@/adapters/tauri/archiveAdapter", () => ({
  tauriArchiveAdapter: {
    toggleArchiveVisibility: (...args: unknown[]) => toggleMock(...args),
    softDeleteArchive: (...args: unknown[]) => softDeleteMock(...args),
    restoreArchive: (...args: unknown[]) => restoreMock(...args),
    openSaveGamesFolder: vi.fn(),
  },
}));

import { useToast } from "../useToast";
import { useArchiveActions } from "../useArchiveActions";
import type { ArchiveData } from "@/types";

const toast = useToast() as unknown as {
  showError: ReturnType<typeof vi.fn>;
  showSuccess: ReturnType<typeof vi.fn>;
};

// ─── Fixtures ────────────────────────────────────────────────────

function makeArchive(overrides: Partial<ArchiveData> = {}): ArchiveData {
  return {
    id: 1,
    name: "MULTIPLAYER_Demo_Easy",
    currentLevel: "Level0",
    gameMode: "multiplayer",
    archiveDifficulty: "easy",
    actualDifficulty: "easy",
    isVisible: false,
    path: "C:\\saves\\MULTIPLAYER_Demo_Easy.sav",
    date: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function setupArchives(initial: ArchiveData[]) {
  const archives = ref<ArchiveData[]>(initial);
  const visibilityCalls: Array<[number, boolean]> = [];
  const archiveData = {
    archives,
    updateArchiveVisibility: (id: number, visible: boolean) => {
      visibilityCalls.push([id, visible]);
      const item = archives.value.find((a) => a.id === id);
      if (item) item.isVisible = visible;
    },
  };
  return { archives, archiveData, visibilityCalls };
}

const okToggle = (isVisible: boolean) => ({
  success: true as const,
  data: { isVisible },
});

// ─── Tests ───────────────────────────────────────────────────────

describe("useArchiveActions — toggle verification", () => {
  beforeEach(() => {
    toggleMock.mockReset();
    softDeleteMock.mockReset();
    restoreMock.mockReset();
    toast.showError.mockClear();
    toast.showSuccess.mockClear();
  });

  it("reconciles the UI with the backend-verified end state on success", async () => {
    const archive = makeArchive({ isVisible: true }); // desired: visible
    const { archives, archiveData, visibilityCalls } = setupArchives([
      makeArchive({ isVisible: false }), // live state: hidden
    ]);
    toggleMock.mockResolvedValue(okToggle(true));
    const { handleToggleVisibility } = useArchiveActions(archiveData, {});

    await handleToggleVisibility(archive);

    // Explicit desired state sent to the backend (not a relative flip)
    expect(toggleMock).toHaveBeenCalledWith(archive.path, archive.name, true);
    // UI reconciled against verified state
    expect(visibilityCalls[visibilityCalls.length - 1]).toEqual([1, true]);
    expect(archives.value[0].isVisible).toBe(true);
    expect(toast.showError).not.toHaveBeenCalled();
  });

  it("retries once and rolls back to backend truth when verification fails twice", async () => {
    const archive = makeArchive({ isVisible: true }); // desired: visible
    const { archiveData, visibilityCalls } = setupArchives([makeArchive({ isVisible: false })]);
    // Backend keeps reporting hidden although invoke resolved
    toggleMock.mockResolvedValue(okToggle(false));
    const { handleToggleVisibility } = useArchiveActions(archiveData, {});

    await handleToggleVisibility(archive);

    expect(toggleMock).toHaveBeenCalledTimes(2);
    // UI rolled back to what the disk actually reports
    expect(visibilityCalls[visibilityCalls.length - 1]).toEqual([1, false]);
    expect(toast.showError).toHaveBeenCalled();
  });

  it("rolls back to the prior state when the backend errors outright", async () => {
    const archive = makeArchive({ isVisible: true });
    const { archives, archiveData } = setupArchives([makeArchive({ isVisible: false })]);
    toggleMock.mockResolvedValue({ success: false, error: "MAINSAVE unreadable" });
    const { handleToggleVisibility } = useArchiveActions(archiveData, {});

    await handleToggleVisibility(archive);

    expect(toggleMock).toHaveBeenCalledTimes(2);
    expect(archives.value[0].isVisible).toBe(false);
    expect(toast.showError).toHaveBeenCalled();
  });

  it("drops a second click on the same archive while a toggle is in flight", async () => {
    const archive = makeArchive({ isVisible: true });
    const { archiveData } = setupArchives([makeArchive({ isVisible: false })]);
    let resolveToggle!: (v: unknown) => void;
    toggleMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveToggle = resolve;
        }),
    );
    const { handleToggleVisibility } = useArchiveActions(archiveData, {});

    const first = handleToggleVisibility(archive);
    const second = handleToggleVisibility(archive); // must be ignored
    resolveToggle(okToggle(true));
    await Promise.all([first, second]);

    expect(toggleMock).toHaveBeenCalledTimes(1);
  });
});

describe("useArchiveActions — delete identity", () => {
  beforeEach(() => {
    toggleMock.mockReset();
    softDeleteMock.mockReset();
    restoreMock.mockReset();
    toast.showError.mockClear();
    toast.showSuccess.mockClear();
  });

  it("splices by stable file path when the enumeration id has shifted", async () => {
    // Live list was refreshed after the modal snapshot was taken: ids shifted.
    const staleSnapshot = makeArchive({ id: 5, path: "C:\\saves\\B.sav", name: "B" });
    const survivor = makeArchive({ id: 5, name: "Other", path: "C:\\saves\\Other.sav" });
    const target = makeArchive({ id: 99, name: "B", path: "C:\\saves\\B.sav" });
    const { archives, archiveData } = setupArchives([survivor, target]);

    softDeleteMock.mockResolvedValue({ success: true });
    const actions = useArchiveActions(archiveData, {});
    actions.deleteArchive(staleSnapshot);
    await actions.confirmDelete();

    expect(softDeleteMock).toHaveBeenCalledWith("C:\\saves\\B.sav");
    expect(archives.value).toHaveLength(1);
    expect(archives.value[0].name).toBe("Other");
    expect(toast.showSuccess).toHaveBeenCalled();
  });
});
