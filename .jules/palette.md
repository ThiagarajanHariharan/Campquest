## 2026-08-18 - Adding ARIA labels to icon-only buttons
**Learning:** This app uses many icon-only buttons for settings, closing models, and navigation without proper ARIA labels. Screen readers will not announce their purpose correctly.
**Action:** When working on this application, always ensure icon-only buttons (`.icon-btn`) include `aria-label` attributes to maintain accessibility.
