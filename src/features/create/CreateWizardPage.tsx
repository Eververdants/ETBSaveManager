/**
 * 经典创建向导页（master CreateArchive → /saves/create/custom）
 * 状态与流程见 hooks/useCreateWizard，本文件只做布局编排
 */
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button, Dialog } from "../../components/ui";
import {
  ArchiveNameCard,
  DifficultySelector,
  InventoryItemSelector,
  LevelPicker,
  PlayerDetailPanel,
  PlayerManager,
} from "../../components/save";
import { useLevelGroups } from "../../hooks/useLevelGroups";
import { useCreateWizard } from "./hooks/useCreateWizard";
import WizardStepper, { WIZARD_TOTAL_STEPS } from "./components/WizardStepper";
import { cn } from "../../utils";

export default function CreateWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groups } = useLevelGroups();
  const {
    step,
    stepDirection,
    canProceed,
    selectedEnding,
    setSelectedEnding,
    selectedLevelKey,
    handleLevelSelect,
    archiveName,
    setArchiveName,
    difficulty,
    setDifficulty,
    actualDifficulty,
    setActualDifficulty,
    players,
    setPlayers,
    activePlayerIndex,
    setActivePlayerIndex,
    activePlayer,
    newSteamId,
    setNewSteamId,
    playerMessage,
    addSteamId,
    removePlayer,
    editingSlot,
    setEditingSlot,
    handleItemSelect,
    isCreating,
    createdName,
    setCreatedName,
    resetForm,
    goNext,
    goPrev,
  } = useCreateWizard();

  const isLastStep = step === WIZARD_TOTAL_STEPS;

  return (
    <div className="flex h-full flex-col">
      {/* 顶栏 */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-2.5">
        <button
          type="button"
          onClick={() => navigate("/saves/create")}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
        >
          <ChevronLeft size={14} />
          {t("common.back")}
        </button>
        <h1 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("createArchive.title")}
        </h1>
        <WizardStepper step={step} />
      </div>

      {/* 内容区 */}
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: stepDirection * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: stepDirection * -32 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={isLastStep ? "h-full" : undefined}
          >
            {/* Step 1：关卡 */}
            <div className={step === 1 ? "block" : "hidden"}>
              <LevelPicker
                groups={groups}
                selectedKey={selectedLevelKey ?? ""}
                activeGroup={selectedEnding}
                onActiveGroupChange={setSelectedEnding}
                onSelect={handleLevelSelect}
                searchPlaceholder={t("createArchive.levelSearchPlaceholder")}
                emptyText={t("createArchive.levelSearchEmpty")}
                badgeText={t("editArchive.unlockMainBadge")}
                clearSearchOnGroupChange
              />
            </div>

            {/* Step 2：命名与难度 */}
            <div
              className={cn(
                "mx-auto max-w-2xl space-y-6",
                step === 2 ? "block" : "hidden"
              )}
            >
              <ArchiveNameCard
                title={t("createArchive.archiveName")}
                label={t("createArchive.archiveName")}
                placeholder={t("createArchive.archiveNamePlaceholder")}
                errorText={t("createArchive.archiveNameError")}
                value={archiveName}
                onChange={setArchiveName}
              />
              <DifficultySelector
                title={t("createArchive.difficulty")}
                i18nPrefix="createArchive"
                archiveDifficulty={difficulty}
                actualDifficulty={actualDifficulty}
                onArchiveDifficultyChange={setDifficulty}
                onActualDifficultyChange={setActualDifficulty}
              />
            </div>

            {/* Step 3：玩家与背包 */}
            <div
              className={cn(
                "grid h-full grid-cols-[minmax(280px,2fr)_3fr] gap-4",
                step === 3 ? "grid" : "hidden"
              )}
            >
              <PlayerManager
                players={players}
                activePlayerIndex={activePlayerIndex}
                newSteamId={newSteamId}
                playerInputMessage={playerMessage?.text ?? ""}
                playerInputMessageType={playerMessage?.type ?? ""}
                titleKey="createArchive.playerManagement"
                emptyHintKey="createArchive.noPlayersHint"
                steamIdPlaceholderKey="createArchive.steamIdPlaceholder"
                showSanity
                onNewSteamIdChange={setNewSteamId}
                onAddSteamId={() => void addSteamId()}
                onRemovePlayer={removePlayer}
                onSelectPlayer={setActivePlayerIndex}
              />
              <div className="min-h-0 overflow-y-auto">
                {activePlayer ? (
                  <PlayerDetailPanel
                    player={activePlayer}
                    slotLabelPrefix="createArchive"
                    onEditSlot={(slotIndex) =>
                      setEditingSlot({ playerIndex: activePlayerIndex, slotIndex })
                    }
                    onSanityChange={(sanity) =>
                      setPlayers((prev) =>
                        prev.map((p, i) => (i === activePlayerIndex ? { ...p, sanity } : p))
                      )
                    }
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
                    {t("createArchive.selectPlayerMessage")}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 底部操作栏 */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-5 py-3">
        <Button
          variant="secondary"
          onClick={goPrev}
          disabled={step === 1}
          icon={<ChevronLeft size={14} />}
        >
          {t("createArchive.previous")}
        </Button>
        <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
          {t("createArchive.step", { number: step })}
        </span>
        <Button
          variant="primary"
          onClick={goNext}
          disabled={!canProceed || isCreating}
          icon={isCreating ? <Loader2 size={14} className="animate-spin" /> : undefined}
        >
          {isLastStep ? t("createArchive.createArchive") : t("createArchive.next")}
          {!isLastStep && <ChevronRight size={14} />}
        </Button>
      </div>

      {/* 物品选择器 */}
      <InventoryItemSelector
        visible={editingSlot !== null}
        selectedItem={
          editingSlot
            ? players[editingSlot.playerIndex]?.inventory[editingSlot.slotIndex] ?? null
            : null
        }
        onClose={() => setEditingSlot(null)}
        onSelect={handleItemSelect}
      />

      {/* 成功弹窗 */}
      <Dialog
        open={createdName !== null}
        onClose={() => {
          setCreatedName(null);
          navigate("/saves/all");
        }}
        maxWidth="380px"
        showClose={false}
        title={t("createArchive.archiveCreated")}
        footer={
          <>
            <Button variant="secondary" onClick={() => navigate("/saves/all")}>
              {t("createArchive.editArchive")}
            </Button>
            <Button variant="secondary" onClick={resetForm}>
              {t("createArchive.createAnother")}
            </Button>
            <Button variant="primary" onClick={() => navigate("/saves/all")}>
              {t("createArchive.goHome")}
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          {t("createArchive.archiveCreatedMessage", { name: createdName ?? "" })}
        </p>
      </Dialog>
    </div>
  );
}
