"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PRESETS } from "@/lib/pdf/compress";
import type { Preset } from "@/components/pdf/compress-reducer";

const OPTIONS: { value: Preset; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export interface PresetPickerProps {
  value: Preset;
  onChange: (preset: Preset) => void;
  disabled?: boolean;
}

export function PresetPicker({ value, onChange, disabled }: PresetPickerProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as Preset)}
      className="gap-2"
      disabled={disabled}
    >
      {OPTIONS.map((option) => {
        const preset = PRESETS[option.value];
        const id = `preset-${option.value}`;
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
              selected
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/40"
            } ${disabled ? "pointer-events-none opacity-50" : ""}`}
          >
            <RadioGroupItem value={option.value} id={id} className="mt-0.5" />
            <div className="flex flex-1 flex-col gap-0.5">
              <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
                {option.label}
              </Label>
              <p className="text-xs text-muted-foreground">
                {preset.dpi} DPI · JPEG quality {Math.round(preset.quality * 100)}%
              </p>
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}

export default PresetPicker;
