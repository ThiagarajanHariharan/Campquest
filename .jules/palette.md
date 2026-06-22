## 2026-04-24 - Custom `div` Toggle Accessibility
**Learning:** Custom toggle switches built with `div` elements often lack essential accessibility features like keyboard navigation and screen reader support.
**Action:** When implementing custom `div` toggles, always ensure they are fully accessible by adding `role="switch"`, `aria-checked`, `tabIndex={0}`, an appropriate `aria-label`, and an `onKeyDown` handler to capture 'Enter' or 'Space' key presses (using `e.preventDefault()` to prevent page scroll), along with a clear `:focus-visible` CSS outline for keyboard navigation.
