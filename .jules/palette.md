## 2024-07-07 - Add ARIA Labels to Icon-Only Buttons
**Learning:** Icon-only buttons in this app frequently use emojis (like ✕, 🚪, ☰, ⚙️) without text. Without ARIA labels, these buttons are inaccessible to screen reader users because the visual meaning isn't conveyed programmatically.
**Action:** Always provide an `aria-label` for buttons that contain only icons or emojis to ensure screen reader compatibility.
