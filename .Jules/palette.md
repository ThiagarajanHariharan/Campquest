## 2026-06-04 - Accessible Custom Div Toggles
**Learning:** Custom 'div' based switches lack native keyboard and screen reader support.
**Action:** When working with custom div-based toggles, always add role="switch", aria-checked, tabIndex={0}, aria-label (or aria-labelledby), and an onKeyDown handler for 'Enter' or 'Space'.
