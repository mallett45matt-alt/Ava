import "server-only";

import { dollarsToCents } from "@/lib/format";

export type ParsedLineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  sortOrder: number;
};

/**
 * The line-item editor submits three parallel arrays (same field name
 * repeated per row) rather than nested `items[0][description]`-style keys —
 * simpler to build and just as easy to zip back together here.
 */
export function parseLineItems(formData: FormData): ParsedLineItem[] {
  const descriptions = formData.getAll("itemDescription").map(String);
  const quantities = formData.getAll("itemQuantity").map(String);
  const unitPrices = formData.getAll("itemUnitPrice").map(String);

  const items: ParsedLineItem[] = [];
  for (let i = 0; i < descriptions.length; i++) {
    const description = descriptions[i]?.trim();
    if (!description) continue;
    const quantity = Number(quantities[i]) || 0;
    const unitPriceCents = dollarsToCents(Number(unitPrices[i]) || 0);
    items.push({ description, quantity, unitPriceCents, sortOrder: items.length });
  }
  return items;
}

export function lineItemsTotalCents(items: { quantity: number; unitPriceCents: number }[]): number {
  return items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPriceCents), 0);
}
