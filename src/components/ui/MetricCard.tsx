"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  accent?: "yellow" | "blue";
  size?: "sm" | "md" | "lg";
}

export function MetricCard({
  label,
  value,
  unit,
  sublabel,
  accent = "yellow",
  size = "md",
}: MetricCardProps) {
  const fontSize = size === "lg" ? "2.2rem" : size === "sm" ? "1.3rem" : "1.8rem";
  const color = accent === "blue" ? "var(--blue-light)" : "var(--yellow-primary)";

  return (
    <div className="card" style={{ padding: "1rem 1.25rem" }}>
      <div
        className="metric-value"
        style={{ fontSize, color, fontVariantNumeric: "tabular-nums" }}
      >
        {typeof value === "number"
          ? isFinite(value) && !isNaN(value)
            ? value % 1 === 0
              ? value.toFixed(0)
              : value.toFixed(2)
            : "—"
          : value}
        {unit && (
          <span
            style={{ fontSize: "0.55em", fontWeight: 500, opacity: 0.7, marginLeft: 2 }}
          >
            {unit}
          </span>
        )}
      </div>
      <div className="metric-label">{label}</div>
      {sublabel && (
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--text-dim)",
            marginTop: "0.2rem",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
