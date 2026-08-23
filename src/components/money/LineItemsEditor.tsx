"use client";

import { useId, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/format";

export type LineItemRow = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function LineItemsEditor({
  defaultItems,
}: {
  defaultItems?: { description: string; quantity: number; unitPriceCents: number }[];
}) {
  const idPrefix = useId();
  const [rows, setRows] = useState<LineItemRow[]>(() => {
    const initial = defaultItems?.length
      ? defaultItems.map((item, i) => ({
          key: `${idPrefix}-${i}`,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: (item.unitPriceCents / 100).toFixed(2),
        }))
      : [{ key: `${idPrefix}-0`, description: "", quantity: "1", unitPrice: "" }];
    return initial;
  });

  function updateRow(key: string, patch: Partial<LineItemRow>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: `${idPrefix}-${prev.length}-${Date.now()}`, description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((row) => row.key !== key) : prev));
  }

  const totalCents = rows.reduce((sum, row) => {
    const qty = Number(row.quantity) || 0;
    const price = Number(row.unitPrice) || 0;
    return sum + Math.round(qty * price * 100);
  }, 0);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-start gap-2">
          <Input
            name="itemDescription"
            placeholder="Description"
            value={row.description}
            onChange={(e) => updateRow(row.key, { description: e.target.value })}
            className="flex-1"
          />
          <Input
            name="itemQuantity"
            type="number"
            step="0.5"
            min="0"
            value={row.quantity}
            onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
            className="w-16"
          />
          <Input
            name="itemUnitPrice"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={row.unitPrice}
            onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
            className="w-24"
          />
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            aria-label="Remove line"
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-muted hover:text-danger disabled:opacity-30"
            disabled={rows.length === 1}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" onClick={addRow}>
        <Plus size={16} /> Add line
      </Button>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3 text-sm">
        <span className="text-muted">Total</span>
        <span className="text-base font-semibold">{formatCents(totalCents)}</span>
      </div>
    </div>
  );
}
