"use client";

import { Product } from "@/lib/types";

type Props = {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
};

export function ProductFilter({ products, value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-soft outline-none focus:border-stock"
    >
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
      ))}
    </select>
  );
}
