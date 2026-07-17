## 2025-02-18 - Icon-only Button Accessibility
**Learning:** React functional components in `frontend/src/App.js` frequently use simple icon/emoji text children for buttons (e.g., `☰`, `✕`, `⚙️`, `🚪`) without explicit descriptions. Screen readers need `aria-label`s on these.
**Action:** When working on UI components, routinely check for and add `aria-label` attributes to any icon-only buttons (`className="icon-btn"`) to ensure the actions are accessible and correctly announced by screen readers.
