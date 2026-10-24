1. **Add `aria-label` to icon-only buttons**
   - The `.icon-btn` buttons in `frontend/src/App.js` currently only contain text like "✕", "🚪", "☰", and "⚙️" without any `aria-label`.
   - Update these elements to include descriptive `aria-label` attributes to improve accessibility for screen readers.

2. **Add `aria-label` to quick login buttons**
   - The `.ql-btn` buttons only contain an avatar initial visually. Add `aria-label` describing the user being selected for login.

3. **Verify the changes visually and functionally**
   - Start the frontend development server.
   - Run UI verification using a Playwright script.

4. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
   - Run local tests (`(cd frontend && CI=true pnpm test --passWithNoTests --forceExit)`).
   - Call `pre_commit_instructions` and follow its instructions.

5. **Submit the PR**
   - Use the `submit` tool to create a pull request with the required PR description sections (`💡 What:`, `🎯 Why:`, `📸 Before/After:`, and `♿ Accessibility:`).
