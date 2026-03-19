"use client";

import { Period } from "@/lib/types";

type Props = {
  value: Period;
  onChange: (period: Period) => void;
};

const options: Period[] = ["3M", "6M", "12M"];

export function PeriodToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-soft">
      {options.map((option) => (
        <button
          key={option}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            value === option ? "bg-stock text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => onChange(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
