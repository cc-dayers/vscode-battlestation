# AGENTS Directive

As an AI agent working on this project, you MUST strictly adhere to the following directives:

## 1. Test Your Fixes

Every time you fix a bug, you MUST add an automated test that ensures we don't regress on that specific issue. This is a hard requirement.

## 2. Check Your Work

Before claiming an issue is fixed, you must ensure your fix actually works and didn't break related functionality. We need to actually test what we say we are testing. Do not claim a fix is complete without running tests and verifying the application behavior automatedly.

## 3. Ensure fixes are confirmed automatedly

To make sure you confirm your fixes automatedly before they reach the user:

- Write programmatic tests using VS Code's testing library or the existing UI test architecture.
- Run `npm run test` or `npm run test:ui` (depending on the type of test) and ensure the tests actually assert the changed UI or behavior.
- In UI tests, ensure elements you expect to display are actually populated and lack visual bugs (e.g. check not just that a menu opens, but that it's visible, positioned correctly, and contains the expected children).
