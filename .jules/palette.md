## 2026-06-16 - Custom Toggle Switches Accessibility
**Learning:** Custom `div`-based switch toggles are common but often lack proper accessibility attributes out-of-the-box, making them invisible to screen readers and unusable via keyboard.
**Action:** When implementing or modifying custom `div` toggles, always add `role="switch"`, an appropriate `aria-checked` state, `aria-labelledby` linking to a visible label, `tabIndex={0}`, and an `onKeyDown` handler to capture 'Enter' or 'Space' key presses for full accessibility.
