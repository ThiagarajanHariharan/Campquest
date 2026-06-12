## 2024-05-24 - Accessibility for Custom Toggles
**Learning:** Custom div-based toggle switches (`.toggle`) in the Settings drawer lacked basic accessibility attributes, preventing keyboard users and screen readers from interacting with them. Using `role="switch"`, `aria-checked`, `tabIndex={0}`, and capturing `onKeyDown` (Enter/Space) effectively converts them into accessible controls.
**Action:** Always verify that custom interactive components (like divs used as buttons/toggles) include necessary ARIA roles, states, and keyboard event handlers to maintain accessibility parity with native elements.

## 2024-05-24 - ARIA Labels for Icon-Only Buttons
**Learning:** Several buttons in the application (`.icon-btn`) used only icons (e.g., ✕, 🚪, ☰, ⚙️) without any descriptive text, making their purpose ambiguous to screen reader users.
**Action:** When implementing or reviewing icon-only interactive elements, ensure they always have a descriptive `aria-label` attribute providing clear context of their action.
