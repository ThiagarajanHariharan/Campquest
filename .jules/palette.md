## 2024-05-24 - Accessible Custom Toggles and Icon Buttons
**Learning:** Custom interactive elements (like `div`-based toggles) require explicit ARIA roles (`role="switch"`), states (`aria-checked`), labeling (`aria-labelledby`), and keyboard event handlers (`onKeyDown`) for 'Enter' or 'Space' keys to be fully accessible. Icon-only buttons must also include explicit `aria-label`s for screen readers.
**Action:** Always verify keyboard focus, activation patterns, and accessible names when building or encountering non-native interactive elements or icon buttons.
