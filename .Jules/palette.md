## 2024-10-21 - Added ARIA Labels to Icon Buttons
**Learning:** This application makes heavy use of emojis and Unicode symbols for icon buttons (like settings gears, menus, and logout doors). These lack explicit text content, rendering them inaccessible to screen readers out-of-the-box.
**Action:** Always verify that 'icon-btn' classed elements or elements containing only emojis have an explicitly defined `aria-label` attribute to describe their action.
