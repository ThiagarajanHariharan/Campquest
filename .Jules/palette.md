## 2024-05-18 - Improve Accessibility of CampusQuest Go
**Learning:** The toggle components and custom buttons lacked keyboard interactivity and visual focus states, rendering them inaccessible to keyboard users and screen readers.
**Action:** Implemented missing ARIA labels, `role="switch"`, explicit tab indices, keyboard event listeners (Enter/Space), and visible focus states across the React frontend.
