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
  /** Button label. Also used to auto-infer color if `variant` is omitted. */
  title: string;
  /** Explicit color/intent. If omitted, inferred from `title` keywords. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string; // Tabler icon class, e.g. "ti-trash"
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

// ─── Keyword → variant inference ───────────────────────────────────────────────
// Used only as a fallback when `variant` isn't explicitly passed.

const KEYWORD_RULES: { variant: ButtonVariant; words: string[] }[] = [
  // Destructive / negative actions
  {
    variant: "danger",
    words: [
      "delete",
      "remove",
      "discard",
      "destroy",
      "revoke",
      "reject",
      "decline",
      "deactivate",
    ],
  },
  // Positive / confirming actions
  {
    variant: "success",
    words: ["save", "approve", "activate", "complete", "publish", "confirm"],
  },
  {
    variant: "warning",
    words: ["archive", "suspend", "pause", "warning"],
  },
  // Creation / primary forward actions
  {
    variant: "primary",
    words: [
      "create",
      "add",
      "new",
      "continue",
      "next",
      "get started",
      "sign up",
      "submit",
    ],
  },
  // Neutral / editing / dismissive actions
  {
    variant: "secondary",
    words: ["edit", "cancel", "back", "close", "dismiss"],
  },
];

function inferVariant(title: string): ButtonVariant {
  const t = title.trim().toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.words.some((w) => t.includes(w))) return rule.variant;
  }
  return "secondary";
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Button({
  title,
  variant,
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
  const resolvedVariant = variant ?? inferVariant(title);

  return (
    <button
      type="button"
      className={`btn btn--${resolvedVariant} btn--${size}${
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