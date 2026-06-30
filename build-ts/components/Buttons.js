import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ─── Keyword → variant inference ───────────────────────────────────────────────
// Used only as a fallback when `variant` isn't explicitly passed.
const KEYWORD_RULES = [
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
function inferVariant(title) {
    const t = title.trim().toLowerCase();
    for (const rule of KEYWORD_RULES) {
        if (rule.words.some((w) => t.includes(w)))
            return rule.variant;
    }
    return "secondary";
}
// ─── Component ─────────────────────────────────────────────────────────────────
export function Button({ title, variant, size = "md", icon, iconPosition = "left", loading = false, fullWidth = false, disabled, className = "", children, ...rest }) {
    const resolvedVariant = variant ?? inferVariant(title);
    return (_jsxs("button", { type: "button", className: `btn btn--${resolvedVariant} btn--${size}${fullWidth ? " btn--full" : ""} ${className}`, disabled: disabled || loading, "aria-busy": loading || undefined, ...rest, children: [loading && _jsx("i", { className: "ti ti-loader-2 btn-spinner", "aria-hidden": "true" }), !loading && icon && iconPosition === "left" && (_jsx("i", { className: `ti ${icon}`, "aria-hidden": "true" })), _jsx("span", { children: children ?? title }), !loading && icon && iconPosition === "right" && (_jsx("i", { className: `ti ${icon}`, "aria-hidden": "true" }))] }));
}
export default Button;
//# sourceMappingURL=Buttons.js.map