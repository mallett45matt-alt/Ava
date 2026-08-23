import type { LucideIcon } from "lucide-react";
import { CalendarDays, LayoutGrid, ListChecks, Receipt, Users } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/money", label: "Money", icon: Receipt },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
];
