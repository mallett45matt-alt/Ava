import Link from "next/link";
import { Search, Users } from "lucide-react";
import { listCustomers } from "@/server/data/customers";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Every customer, and everything you know about them."
        action={<ButtonLink href="/customers/new">Add customer</ButtonLink>}
      />

      <form action="/customers" className="relative mb-5">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, phone, email or address"
          className="pl-10"
        />
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title={q ? "No customers match that search" : "No customers yet"}
          description={
            q ? "Try a different name, phone or address." : "Add your first customer to get started."
          }
          action={!q && <ButtonLink href="/customers/new">Add customer</ButtonLink>}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{customer.name}</p>
                  <p className="truncate text-sm text-muted">
                    {[customer.phone, customer.email, customer.address]
                      .filter(Boolean)
                      .join(" · ") || "No contact details yet"}
                  </p>
                </div>
                {customer._count.jobs > 0 && (
                  <span className="shrink-0 text-xs text-muted">
                    {customer._count.jobs} job{customer._count.jobs === 1 ? "" : "s"}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
