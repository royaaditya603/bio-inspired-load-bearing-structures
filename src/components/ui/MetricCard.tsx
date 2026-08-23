"use client";

import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sublabel?: string;
  accent?: "yellow" | "blue" | "green";
  size?: "sm" | "md" | "lg";
}

export function MetricCard({
  label,
  value,
  unit,
  sublabel,
  accent = "blue",
  size = "md",
}: MetricCardProps) {
  const fontSize = size === "lg" ? "2.1rem" : size === "sm" ? "1.25rem" : "1.65rem";
  const borderTopColor =
    accent === "yellow" ? "#F8E7A6" : accent === "green" ? "#BFE3D0" : "#A9D8F5";

  return (
    <div
      className="card"
      style={{
        padding: "1rem 1.15rem",
        background: "#FFFFFF",
        borderTop: `3px solid ${borderTopColor}`,
        boxShadow: "0 2px 6px rgba(36, 52, 71, 0.04)",
      }}
    >
      <div
        className="metric-value"
        style={{ fontSize, color: "#243447", fontVariantNumeric: "tabular-nums" }}
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
            style={{ fontSize: "0.55em", fontWeight: 600, color: "#62748A", marginLeft: 3 }}
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
            color: "#8C9BAE",
            marginTop: "0.2rem",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}
