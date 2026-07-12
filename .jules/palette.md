## 2024-07-12 - Icon-Only Buttons Accessibility
**Learning:** Found multiple instances where emoji/symbol-only buttons (`☰`, `⚙️`, `✕`, `🚪`) were used without text content or `aria-label`s, rendering them inaccessible to screen readers.
**Action:** Always add descriptive `aria-label` attributes to any `.icon-btn` or button relying solely on visual emojis/icons to communicate its function.
