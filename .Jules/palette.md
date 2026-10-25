## 2024-10-25 - ARIA Labels for Icon Buttons
**Learning:** The app's layout relies on several icon-only buttons (close, logout, menu, settings) that lack accessible names. This breaks accessibility for screen reader users and affects keyboard navigation context.
**Action:** Always verify icon-only buttons have an `aria-label` or visually hidden text when auditing new components or layouts in this application.
