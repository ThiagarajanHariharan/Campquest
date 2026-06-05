## 2024-05-24 - Accessible Custom Div Toggles
**Learning:** Custom div-based switch toggles must be explicitly assigned ARIA roles, states, labels, and keyboard events. Screen readers cannot interpret them as interactive without role="switch", aria-checked, tabIndex={0}, aria-labelledby, and an onKeyDown handler for 'Enter'/'Space'.
**Action:** When implementing custom toggle inputs outside of native <input type="checkbox"> elements, always layer standard ARIA form control equivalents.
