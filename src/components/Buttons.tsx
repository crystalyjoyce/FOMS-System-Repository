import React, { ButtonHTMLAttributes, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "warning"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  /** Button label. */
  title: string;
  /** Explicit color/intent. Defaults to "primary". */
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string; // Tabler icon class, e.g. "ti-trash"
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size}${
        fullWidth ? " btn--full" : ""
      } ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <i className="ti ti-loader-2 btn-spinner" aria-hidden="true" />}
      {!loading && icon && iconPosition === "left" && (
        <i className={`ti ${icon}`} aria-hidden="true" />
      )}
      <span>{children ?? title}</span>
      {!loading && icon && iconPosition === "right" && (
        <i className={`ti ${icon}`} aria-hidden="true" />
      )}
    </button>
  );
}

export default Button;
