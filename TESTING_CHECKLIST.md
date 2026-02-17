# Testing Checklist for v0.0.2

## ✅ Pre-Test Verification
- [x] Tag v0.0.2 created and pushed
- [x] VSIX built from main (109.25 KB)
- [x] Test config exists in .battle/battle.config

## �� Manual Test Instructions

### 1. Launch Extension
Press **F5** in VS Code to start Extension Development Host

### 2. Test Visual Customization
- [ ] Open Battlestation panel (View → Open View → Battlestation)
- [ ] Verify "Development" group has GREEN border and subtle background
- [ ] Verify "Development" group has 🔧 (tools) icon
- [ ] Verify "Containers" group has BLUE border
- [ ] Verify "Containers" group has 🐳 emoji icon
- [ ] Verify "Docker Build" action has BLUE background
- [ ] Hover over "Build" action and verify 🎨 button appears
- [ ] Click 🎨 button and verify color picker quick pick appears
- [ ] Select a color and verify it applies to the action
- [ ] Click gear icon on "Development" group header
- [ ] Verify Edit Group form shows 3 color pickers (text, background, border)
- [ ] Change a color and verify it persists

### 3. Test Enhanced Tool Detection
- [ ] Delete .battle/battle.config file
- [ ] Reload Battlestation panel
- [ ] Verify "Generate Configuration" screen appears
- [ ] Verify "Enhanced Mode" section appears with detection method at TOP
- [ ] Verify detection method radio buttons: Hybrid, File-based, Command-based
- [ ] Change detection method and verify checkboxes enable/disable
- [ ] Select some tools and click Generate
- [ ] Verify actions are created for selected tools
- [ ] Verify actions are grouped by tool type if grouping enabled

### 4. Test Backwards Compatibility
- [ ] Create a config without any color properties
- [ ] Verify extension loads and displays correctly
- [ ] Add a group without colors
- [ ] Verify it displays with default styling

## 📸 Screenshots to Capture
1. Main view with colored groups
2. Action hover showing 🎨 button
3. Color picker quick pick menu
4. Edit Group form with 3 color pickers
5. Enhanced mode section with detection methods
6. Generated config with tool detection

## Expected Results Summary
- All colors should use VS Code theme variables
- Colors should work with light and dark themes
- Hover buttons should appear smoothly
- Config generation should detect available tools
- All existing features should still work

Ready to test? Press F5 in VS Code!
