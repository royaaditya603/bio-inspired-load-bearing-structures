"use client";

import React from "react";

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  return (
    <label className="toggle-wrap" onClick={() => onChange(!checked)} style={{ cursor: "pointer" }}>
      <div className={`toggle-track ${checked ? "active" : ""}`}>
        <div className="toggle-thumb" />
      </div>
      <span style={{ fontSize: "0.82rem", color: "#A9BCD2", fontWeight: 500 }}>
        {label}
      </span>
    </label>
  );
}
