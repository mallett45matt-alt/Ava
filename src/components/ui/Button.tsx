import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 active:opacity-80 shadow-sm",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-background",
  ghost: "text-foreground hover:bg-black/5 dark:hover:bg-white/5",
  danger: "bg-danger text-white hover:opacity-90 active:opacity-80 shadow-sm",
};

const sizes = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-base rounded-xl gap-2",
};

type CommonProps = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children?: React.ReactNode;
};

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkProps = CommonProps &
  React.ComponentProps<typeof Link> & { href: string };

function baseClasses(variant: keyof typeof variants, size: keyof typeof sizes, className?: string) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return <button className={baseClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkProps) {
  return <Link className={baseClasses(variant, size, className)} {...props} />;
}
