"use client";

// ============================================================
// SliderControl.tsx — Labelled range slider
// ============================================================

import React from "react";
import styles from "./SliderControl.module.css";

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  accentColor?: "blue" | "yellow";
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  disabled = false,
  accentColor = "blue",
}: SliderControlProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`${styles.wrap} ${disabled ? styles.disabled : ""}`}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span
          className={`${styles.value} ${
            accentColor === "yellow" ? styles.valueYellow : styles.valueBlue
          }`}
        >
          {typeof value === "number" ? value.toFixed(step < 1 ? 2 : 0) : value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${
            accentColor === "yellow" ? styles.fillYellow : styles.fillBlue
          }`}
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className={styles.input}
        />
      </div>
      <div className={styles.minmax}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
