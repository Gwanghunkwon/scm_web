"use client";

import { MaterialRow } from "@/lib/types";

type Props = {
  material: MaterialRow | null;
  onClose: () => void;
};

export function MaterialDetailModal({ material, onClose }: Props) {
  if (!material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-lg font-semibold">{material.materialName}</h4>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
        <div className="space-y-2 text-sm text-slate-600">
          <p>현재고: {material.currentStock.toLocaleString()} {material.unit}</p>
          <p>필요수량: {material.requiredQty.toLocaleString()} {material.unit}</p>
          <p>부족수량: {material.shortageQty.toLocaleString()} {material.unit}</p>
          <p>권장 발주: {material.suggestedOrderQty.toLocaleString()} {material.unit}</p>
        </div>
      </div>
    </div>
  );
}
