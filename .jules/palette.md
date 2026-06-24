## 2024-06-24 - Accessible Custom Toggles
**Learning:** Custom `div`-based toggles in React lose all native accessibility features (keyboard navigation, screen reader state announcement, focus indication). Users navigating via keyboard get trapped or skip interactive elements entirely.
**Action:** When implementing custom toggles, always add `role="switch"`, `aria-checked`, `tabIndex={0}`, link with `aria-labelledby`, implement an `onKeyDown` handler for 'Enter'/'Space' (preventing default scroll), and provide a distinct `:focus-visible` CSS outline.
