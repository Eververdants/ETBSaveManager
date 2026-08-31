/**
 * 玩家列表 — 选择 / 删除 / 添加（创建与编辑共用）
 */
import { useTranslation } from "react-i18next";
import { Trash2, User, UserPlus, Plus } from "lucide-react";

import { cn } from "../../utils";

export interface PlayerRow {
  username?: string | null;
  isOfflinePlayer?: boolean;
  steamId: string;
  sanity?: number;
}

export interface PlayerManagerProps {
  players: PlayerRow[];
  activePlayerIndex: number;
  newSteamId: string;
  playerInputMessage?: string;
  playerInputMessageType?: "success" | "error" | "";
  titleKey?: string;
  emptyHintKey?: string;
  steamIdPlaceholderKey?: string;
  showSanity?: boolean;
  embedded?: boolean;
  showHeader?: boolean;
  showCount?: boolean;
  onNewSteamIdChange: (value: string) => void;
  onAddSteamId: () => void;
  onRemovePlayer: (index: number) => void;
  onSelectPlayer: (index: number) => void;
}

export function getSanityClass(val: number): string {
  if (val >= 80) return "sanity-high";
  if (val >= 50) return "sanity-medium";
  if (val >= 20) return "sanity-low";
  return "sanity-critical";
}

const SANITY_STYLES: Record<string, string> = {
  "sanity-high": "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  "sanity-medium": "bg-[var(--color-danger-subtle)] text-[#c2820c] dark:text-[#eab308]",
  "sanity-low": "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]",
  "sanity-critical": "bg-[var(--color-danger)]/20 text-[var(--color-danger)]",
};

export default function PlayerManager({
  players,
  activePlayerIndex,
  newSteamId,
  playerInputMessage,
  playerInputMessageType = "",
  titleKey = "editArchive.playerManagement",
  emptyHintKey = "editArchive.noPlayersHint",
  steamIdPlaceholderKey = "editArchive.steamIdPlaceholder",
  showSanity = false,
  embedded = false,
  showHeader = true,
  showCount = true,
  onNewSteamIdChange,
  onAddSteamId,
  onRemovePlayer,
  onSelectPlayer,
}: PlayerManagerProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)]",
        embedded && "border-none bg-transparent"
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-2 border-b border-[var(--color-border-light)] px-4 py-3.5 text-sm font-semibold text-[var(--color-text-primary)]">
          <span>{t(titleKey)}</span>
          {showCount && (
            <span className="ml-auto rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-primary-fg)]">
              {players.length}
            </span>
          )}
        </div>
      )}

      {players.length > 0 ? (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {players.map((player, index) => {
            const active = activePlayerIndex === index;
            const sanity = player.sanity ?? 100;
            return (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={() => onSelectPlayer(index)}
                onKeyDown={(e) => e.key === "Enter" && onSelectPlayer(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-150",
                  active
                    ? "bg-[var(--color-primary-subtle)] ring-2 ring-[var(--color-primary)]"
                    : "bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-muted)]"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                      : "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                  )}
                >
                  <User size={16} />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-semibold text-[var(--color-text-primary)]">
                    {player.username ||
                      (player.isOfflinePlayer
                        ? `${player.steamId}${t("common.localPlayerSuffix")}`
                        : player.steamId)}
                  </span>
                  {showSanity && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                        SANITY_STYLES[getSanityClass(sanity)]
                      )}
                    >
                      {sanity}%
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={t("common.delete")}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePlayer(index);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-danger-subtle)] text-[var(--color-danger)] transition-colors hover:brightness-95"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 p-6 text-center text-[var(--color-text-muted)]">
          <UserPlus size={28} strokeWidth={1.5} className="opacity-50" />
          <p className="text-xs leading-relaxed">{t(emptyHintKey)}</p>
        </div>
      )}

      <div className="flex gap-2.5 border-t border-[var(--color-border-light)] p-4">
        <input
          value={newSteamId}
          type="text"
          placeholder={t(steamIdPlaceholderKey)}
          onChange={(e) => onNewSteamIdChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAddSteamId()}
          className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] px-3 text-[13px] text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-ring)]"
        />
        <button
          type="button"
          aria-label={t("common.add")}
          onClick={onAddSteamId}
          className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-fg)] transition-all hover:bg-[var(--color-primary-hover)] active:scale-95"
        >
          <Plus size={16} />
        </button>
      </div>

      {playerInputMessage && (
        <div
          className={cn(
            "mx-4 mb-4 rounded-md px-4 py-2.5 text-[13px]",
            playerInputMessageType === "success"
              ? "bg-[var(--color-success-subtle)] text-[var(--color-success)]"
              : "bg-[var(--color-danger-subtle)] text-[var(--color-danger)]"
          )}
        >
          {playerInputMessage}
        </div>
      )}
    </div>
  );
}
