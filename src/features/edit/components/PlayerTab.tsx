/**
 * 编辑存档 — 玩家 Tab：玩家列表 + Steam ID 内联编辑 + 详情面板
 */
import { useTranslation } from "react-i18next";
import { Check, Pencil, User, X } from "lucide-react";

import { Card, Input } from "../../../components/ui";
import { PlayerDetailPanel, PlayerManager } from "../../../components/save";
import type { EditPlayer } from "../types";

export interface PlayerTabProps {
  players: EditPlayer[];
  activePlayerIndex: number;
  newSteamId: string;
  playerInputMessage: string;
  playerInputMessageType: "success" | "error" | "";
  /** 当前内联编辑中的玩家下标；null 表示未编辑 */
  editingSteamIdIndex: number | null;
  editingSteamIdValue: string;
  onNewSteamIdChange: (value: string) => void;
  onAddSteamId: () => void;
  onRemovePlayer: (index: number) => void;
  onSelectPlayer: (index: number) => void;
  onEditSlot: (slotIndex: number) => void;
  onSanityChange: (sanity: number) => void;
  onStartEditSteamId: (index: number) => void;
  onEditingSteamIdValueChange: (value: string) => void;
  onCommitSteamId: () => void;
  onCancelEditSteamId: () => void;
}

export default function PlayerTab(props: PlayerTabProps) {
  const { t } = useTranslation();
  const {
    players,
    activePlayerIndex,
    editingSteamIdIndex,
    editingSteamIdValue,
    onCommitSteamId,
    onCancelEditSteamId,
    onStartEditSteamId,
    onEditingSteamIdValueChange,
  } = props;

  const activePlayer = activePlayerIndex >= 0 ? players[activePlayerIndex] : null;

  return (
    <div className="grid h-full grid-cols-[minmax(280px,2fr)_3fr] gap-4">
      <PlayerManager
        players={players}
        activePlayerIndex={activePlayerIndex}
        newSteamId={props.newSteamId}
        playerInputMessage={props.playerInputMessage}
        playerInputMessageType={props.playerInputMessageType}
        onNewSteamIdChange={props.onNewSteamIdChange}
        onAddSteamId={props.onAddSteamId}
        onRemovePlayer={props.onRemovePlayer}
        onSelectPlayer={props.onSelectPlayer}
      />

      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
        {activePlayer ? (
          <>
            {/* 显示名 + Steam ID 内联编辑 */}
            <Card className="space-y-3 p-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                  <User size={15} />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {activePlayer.username || activePlayer.steamId}
                </p>
                {activePlayer.isOfflinePlayer && (
                  <span className="rounded-full bg-[var(--color-bg-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                    {t("createArchive.offlinePlayer")}
                  </span>
                )}
              </div>

              {editingSteamIdIndex === activePlayerIndex ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={editingSteamIdValue}
                    onChange={(e) => onEditingSteamIdValueChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onCommitSteamId();
                      if (e.key === "Escape") onCancelEditSteamId();
                    }}
                    className="h-8 text-xs"
                  />
                  <button
                    type="button"
                    aria-label={t("common.confirm")}
                    onClick={onCommitSteamId}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-success-subtle)] text-[var(--color-success)] hover:brightness-95"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={t("common.cancel")}
                    onClick={onCancelEditSteamId}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-muted)] text-[var(--color-text-secondary)] hover:brightness-95"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-xs text-[var(--color-text-secondary)]">
                    {t("common.steamId")}: {activePlayer.steamId}
                  </span>
                  <button
                    type="button"
                    aria-label={t("common.edit")}
                    onClick={() => onStartEditSteamId(activePlayerIndex)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </Card>

            <PlayerDetailPanel
              player={activePlayer}
              slotLabelPrefix="editArchive"
              onEditSlot={props.onEditSlot}
              onSanityChange={props.onSanityChange}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-[var(--color-border-default)] text-xs text-[var(--color-text-muted)]">
            {t("editArchive.selectPlayerHint")}
          </div>
        )}
      </div>
    </div>
  );
}
