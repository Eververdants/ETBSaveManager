/**
 * 存档命名卡片 — 标题 + 标签 + 输入（名称含 _ 时显示错误）
 */
import { TriangleAlert } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Input } from "../ui";
import { Card } from "../ui";
import SectionTitle from "./SectionTitle";

export interface ArchiveNameCardProps {
  title?: string;
  label: string;
  placeholder?: string;
  /** 名称含下划线时显示的错误文案 */
  errorText?: string;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
}

export default function ArchiveNameCard({
  title,
  label,
  placeholder,
  errorText,
  maxLength = 50,
  value,
  onChange,
}: ArchiveNameCardProps) {
  const hasError = Boolean(errorText) && value.includes("_");

  return (
    <div className="flex flex-col gap-3.5">
      {title && <SectionTitle icon={<CircleInfoIcon />}>{title}</SectionTitle>}
      <Card className="p-5">
        <label className="mb-3 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
          {label}
        </label>
        <Input
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          invalid={hasError}
          onChange={(e) => onChange(e.target.value)}
        />
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-2.5 flex items-center gap-2 rounded-md bg-[var(--color-danger-subtle)] px-3 py-2 text-[13px] text-[var(--color-danger)]"
            >
              <TriangleAlert size={14} className="shrink-0" />
              {errorText}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}

function CircleInfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
