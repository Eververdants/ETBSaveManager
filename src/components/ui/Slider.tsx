/**
 * 滑块 — 范围输入（理智值等）
 */
import { cn } from "../../utils";

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled,
  className,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("slider w-full", disabled && "opacity-50", className)}
      style={
        {
          "--fill-percent": `${pct}%`,
        } as React.CSSProperties
      }
    />
  );
}
