import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ─── Component ─────────────────────────────────────────────────────────────────
export function Button({ title, variant = "primary", size = "md", icon, iconPosition = "left", loading = false, fullWidth = false, disabled, className = "", children, ...rest }) {
    return (_jsxs("button", { type: "button", className: `btn btn--${variant} btn--${size}${fullWidth ? " btn--full" : ""} ${className}`, disabled: disabled || loading, "aria-busy": loading || undefined, ...rest, children: [loading && _jsx("i", { className: "ti ti-loader-2 btn-spinner", "aria-hidden": "true" }), !loading && icon && iconPosition === "left" && (_jsx("i", { className: `ti ${icon}`, "aria-hidden": "true" })), _jsx("span", { children: children ?? title }), !loading && icon && iconPosition === "right" && (_jsx("i", { className: `ti ${icon}`, "aria-hidden": "true" }))] }));
}
export default Button;
//# sourceMappingURL=Buttons.js.map