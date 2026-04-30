"use client";

import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
        variant === "primary" && "border-brand-600 bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "border-line bg-white text-ink hover:bg-brand-50",
        variant === "ghost" && "border-transparent bg-transparent text-muted hover:bg-white hover:text-ink",
        variant === "danger" && "border-red-600 bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
