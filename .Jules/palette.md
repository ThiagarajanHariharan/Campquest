## $(date +%Y-%m-%d) - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found multiple `<button className="icon-btn">...</button>` instances containing only emojis (e.g., ✕, 🚪, ☰) without accessible names. This is an accessibility issue pattern in this app's components, making them uninterpretable by screen readers.
**Action:** Always add `aria-label` attributes to any icon-only or emoji-only interactive elements to ensure full accessibility support.
