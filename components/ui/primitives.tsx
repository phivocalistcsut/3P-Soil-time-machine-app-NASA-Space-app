"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import * as React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------------------------------- Button --------------------------------- */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "subtle" | "danger" | "dark" | "glass";
type Size = "sm" | "md" | "lg" | "icon";

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 select-none",
    "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water",
    size === "sm" && "h-9 px-3.5 text-sm",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-7 text-[15px]",
    size === "icon" && "h-10 w-10",
    variant === "primary" && "bg-lime text-space-900 hover:bg-lime-bright shadow-sm",
    variant === "secondary" && "bg-lime-soft text-lime-ink hover:bg-[#e2f0cf]",
    variant === "outline" && "border border-line bg-white text-ink hover:border-lime hover:bg-lime-soft/60",
    variant === "ghost" && "text-ink-2 hover:bg-sand-2 hover:text-ink",
    variant === "subtle" && "bg-sand-2 text-ink hover:bg-[#e3e6de]",
    variant === "danger" && "bg-risk-soft text-risk-ink hover:bg-[#f3d3ce]",
    variant === "dark" && "bg-space-900 text-white hover:bg-space-700",
    variant === "glass" && "border border-white/45 bg-white/5 text-white backdrop-blur hover:border-lime hover:bg-white/10",
    className,
  );
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant, size, className, type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

/* ----------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl border border-line bg-white shadow-[var(--shadow-card)] print-card", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  icon,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-5 pt-4", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <div className="mt-0.5 shrink-0 text-lime-ink">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-tight text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-ink-2">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "green" | "blue" | "amber" | "red" | "dark" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5",
        tone === "neutral" && "bg-sand-2 text-ink-2",
        tone === "green" && "bg-lime-soft text-lime-ink",
        tone === "blue" && "bg-water-soft text-water-ink",
        tone === "amber" && "bg-amber-soft text-amber-ink",
        tone === "red" && "bg-risk-soft text-risk-ink",
        tone === "dark" && "bg-space-900 text-white",
        tone === "outline" && "border border-line bg-white text-ink-2",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------- Fields --------------------------------- */

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink", className)} {...props} />;
}

export const inputClass =
  "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-3 transition-colors hover:border-[#cfd5cc] focus:border-lime-ink focus:outline-none focus:ring-2 focus:ring-lime/30 disabled:bg-sand-2";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        inputClass,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%235d6d65%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Hint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1.5 text-xs text-ink-2", className)} {...props} />;
}

/* --------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} />;
}

export function SectionTitle({ eyebrow, title, desc, className }: { eyebrow?: string; title: React.ReactNode; desc?: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      {eyebrow && <p className="eyebrow mb-1.5 text-lime-ink">{eyebrow}</p>}
      <h1 className="text-2xl font-bold text-ink md:text-[28px]">{title}</h1>
      {desc && <p className="mt-1.5 max-w-3xl text-sm text-ink-2 md:text-[15px]">{desc}</p>}
    </div>
  );
}
