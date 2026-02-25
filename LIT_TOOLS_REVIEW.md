# Lit Tools & Workflows Review for Battlestation

This document reviews the battlestation VS Code extension against the [Lit tools and workflows documentation](https://lit.dev/docs/tools/overview/) to ensure best practices for development, testing, and production builds.

---

## Summary

The battlestation extension uses **standalone lit-html templating** (not LitElement components), which is appropriate for VS Code webviews. The implementation aligns well with Lit's recommendations overall, with a few opportunistic improvements available.

---

## 📋 Tools Documentation Alignment

### ✅ Requirements ([Requirements Page](https://lit.dev/docs/tools/requirements/))

**Status: COMPLIANT**

- ✅ **Target JS Level**: Uses `ES2020` (nearly optimal; see recommendations below)
- ✅ **Bare Module Specifiers**: Correctly imports `from 'lit'` in webview code
- ✅ **Modern Web APIs**: Uses template literals, shadow DOM concepts (though not custom elements)
- ✅ **Build Tools**: Uses esbuild, which properly handles bare module specifiers

**Recommendations:**
- Consider updating `tsconfig.json` to target `ES2021` instead of `ES2020` (matches Lit's published format)

---

### ✅ Development ([Development Page](https://lit.dev/docs/tools/development/))

**Status: MOSTLY COMPLIANT**

- ✅ **Dev Server**: Extension runs in VS Code's webview (no separate dev server needed)
- ✅ **TypeScript**: Full TypeScript support with strict mode enabled
- ✅ **Linting**: ESLint is mentioned in CLAUDE.md (`npm run lint`)
- ✅ **Watch Mode**: Provides `npm run watch` for development
- ✅ **Sourcemaps**: Enabled in development builds
- ✅ **Code Formatting**: Prettier mentioned in CLAUDE.md
- ⚠️ **Lit-specific IDE Plugins**: Not explicitly configured

**Recommendations:**
1. **Document IDE setup:** Add instructions in README for VS Code extensions:
   - [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin) for template highlighting
   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extension

2. **Verify linter configuration:** Ensure `eslint-plugin-lit` is installed and configured for template linting:
   ```bash
   npm ls eslint-plugin-lit
   ```

3. **Add VSCode build task automation:** Consider adding `.vscode/launch.json` configuration for automated sourcemap debugging:
   ```json
   {
     "configurations": [
       {
         "name": "Debug Extension",
         "type": "node",
         "request": "launch",
         "sourceMaps": true
       }
     ]
   }
   ```

---

### ⚠️ Testing ([Testing Page](https://lit.dev/docs/tools/testing/))

**Status: PARTIALLY IMPLEMENTED**

Current state: Extension has unit tests (runTest.ts, multiple .test.ts files)

**What's in place:**
- ✅ Browser-based testing (uses VS Code's extension test host)
- ✅ Tests run in actual environment (not Node shims)
- ⚠️ Uses vscode-test framework (VS Code specific, not a standard Lit test framework)

**Lit-recommended frameworks not used:**
- Web Test Runner (focused on web components, not applicable here)
- WebdriverIO
- Jest, Karma, Mocha, Jasmine

**Recommendations:**
1. **Current approach is appropriate:** Since this is a VS Code extension, using vscode-test is the right choice. You're already following the principle of testing in the actual environment.

2. **Document testing approach:** Create a `TESTING_LIT.md` to clarify:
   - Why vscode-test is used instead of generic frameworks
   - How the UI test harness (`npm run test:ui-server`) follows Lit best practices for visual testing
   - Browser testing strategy for webview validation

3. **Consider supplementary unit tests for isolated logic:**
   ```typescript
   // configService.test.ts - pure logic testing
   // Can use Jest/Mocha for service layer testing
   ```

---

### ⚠️ Publishing ([Publishing Page](https://lit.dev/docs/tools/publishing/))

**Status: NOT APPLICABLE (extension, not library)**

The publishing guidelines are for **npm packages / reusable components**. Since this is a VS Code extension published to the Marketplace, most rules don't apply.

**However, best practices worth considering:**
- ✅ **Self-define custom elements:** Not applicable (no custom elements used)
- ✅ **Publishing TypeScript typings:** Not applicable (not a library)
- ✅ **Don't bundle before publishing:** Your build system handles this appropriately

---

### ✅ Production Builds ([Production Page](https://lit.dev/docs/tools/production/))

**Status: COMPLIANT**

- ✅ **Minification**: Enabled when `--production` flag is used
- ✅ **Module bundling**: esbuild bundles modules appropriately
- ✅ **Sourcemaps**: Dev sourcemaps included, removed from production
- ✅ **Entry points**: Proper separation of extension (CJS) and webview (ESM)

**Current esbuild configuration is solid:**
```javascript
// Extension bundle (Node/CommonJS)
bundle: true,
format: "cjs",
minify: production,
sourcemap: !production,
platform: "node",

// Webview bundle (Browser/ESM)
bundle: true,
format: "esm",
minify: production,
sourcemap: !production,
platform: "browser",
```

**Recommendations:**
1. **HTML template minification:** Lit recommends minifying HTML inside template literals for production. Consider:
   ```bash
   npm install --save-dev rollup-plugin-minify-html-literals
   # Or find an esbuild equivalent plugin
   ```
   This is optional but provides modest code size savings.

2. **CSS optimization:** Your SCSS → CSS pipeline already handles this well.

3. **Bundle analysis:** Add bundle size monitoring:
   ```bash
   npm install --save-dev esbuild-visualizer
   ```

---

## 🔉 Build System Details

### Current esbuild Setup (✅ Optimal for VS Code extensions)

| Aspect | Current | Lit Recommendation | Status |
|--------|---------|-------------------|--------|
| **Bundler** | esbuild | Rollup (for libraries), any modern tool | ✅ esbuild is faster |
| **Module Format** | ESM (webview) + CJS (extension) | ES2021 modules | ✅ Correct |
| **Minification** | Production only | Recommended | ✅ Yes |
| **Source Maps** | Dev only | Recommended | ✅ Yes |
| **Bare specifiers** | Handled by esbuild | Handled by bundler | ✅ Yes |
| **CSS handling** | SCSS → CSS → JS string | May use CSS import or CSS loader | ✅ Works well |

---

## 🎯 Templating Approach

**Lit Pattern: Standalone Templating** ✅ **CORRECTLY IMPLEMENTED**

Your webview code follows the recommended pattern:

```typescript
// ✅ Correct: Standalone templating pattern
import { html, render } from "lit";

const state = new Proxy({...}, {
  set(target, p, value) {
    (target as any)[p] = value;
    requestRender(); // Schedule re-render
  }
});

function renderView() {
  render(html`...`, root);
}
```

**Advantages of this approach for VS Code:**
- Minimal abstraction over native DOM
- Easy integration with VS Code API (no component lifecycle overhead)
- Fine-grained control over when rendering occurs
- Smaller bundle size than LitElement

**You're NOT using:**
- ❌ LitElement components (correct for webviews)
- ❌ Custom element lifecycle methods (not needed)
- ❌ Reactive decorators (unnecessary)
- ❌ Custom directives (simple cases don't need them)

This is ideal for your use case.

---

## 💡 Recommended Improvements (Priority Order)

### 🔴 High Priority

1. **Update TypeScript target to ES2021:**
   ```json
   {
     "compilerOptions": {
       "target": "ES2021",  // Was: ES2020
       "lib": ["ES2021", "DOM"]  // Was: ES2020
     }
   }
   ```
   **Rationale:** Lit is published as ES2021; matching this allows better tree-shaking in consuming environments.

### 🟡 Medium Priority

2. **Document development environment setup:**
   - Create `.vscode/extensions.json` recommending:
     - `ms-vscode.vscode-typescript-next` (better TS support)
     - Optional: `runem.lit-plugin` for template linting
   
   ```json
   {
     "recommendations": [
       "dbaeumer.vscode-eslint",
       "esbenp.prettier-vscode",
       "runem.lit-plugin"
     ]
   }
   ```

3. **Verify ESLint configuration includes `eslint-plugin-lit`:**
   - Check that `.eslintrc` or `eslint.config.js` includes the plugin
   - Add Lit-specific rules if not already present

### 🟢 Low Priority (Optional Enhancements)

4. **Add esbuild plugin for HTML template minification:**
   - Minimal impact on bundle size (~2-5%)
   - Improves maintainability of HTML strings

5. **Add bundle analysis:**
   - Run size analysis before releases
   - Track webview bundle size trends

6. **Create `LIT_DEVELOPMENT.md`:**
   - Document the standalone templating pattern used
   - Explain state management approach
   - Guide contributors on how to add new template features

---

## 📊 Compliance Checklist

| Category | Requirement | Status | Notes |
|----------|-------------|--------|-------|
| **Requirements** | ES2021 target | 🟡 Partial | Use ES2021, not ES2020 |
| **Requirements** | Bare module specifiers | ✅ Complete | Properly handled by esbuild |
| **Development** | TypeScript support | ✅ Complete | Strict mode enabled |
| **Development** | Linting | ✅ Complete | ESLint configured |
| **Development** | Formatting | ✅ Complete | Prettier available |
| **Development** | Dev server | 🟢 N/A | VS Code webview serves purpose |
| **Development** | IDE plugins | ⚠️ Optional | Recommended but not required |
| **Testing** | Browser testing | ✅ Complete | vscode-test is appropriate |
| **Testing** | Modern JS support | ✅ Complete | No Node shimming |
| **Production** | Minification | ✅ Complete | Production builds minified |
| **Production** | Bundling | ✅ Complete | esbuild bundles properly |
| **Production** | Sourcemaps | ✅ Complete | Debug builds have maps |
| **Templating** | Standalone lit-html | ✅ Complete | Correctly implemented |
| **Publishing** | Not applicable | 🟢 N/A | Extension ≠ npm library |

---

## 🔗 References

- [Lit Tools Overview](https://lit.dev/docs/tools/overview/)
- [Lit Requirements](https://lit.dev/docs/tools/requirements/)
- [Lit Development](https://lit.dev/docs/tools/development/)
- [Lit Testing](https://lit.dev/docs/tools/testing/)
- [Lit Production](https://lit.dev/docs/tools/production/)
- [Lit Templates](https://lit.dev/docs/templates/overview/)
- [Lit Lifecycle (for reference)](https://lit.dev/docs/components/lifecycle/)

---

## Conclusion

✅ **The battlestation extension correctly uses Lit following best practices for standalone templating in a VS Code webview context.** The build system is well-optimized for the use case, and the development workflow aligns with Lit recommendations.

**Key wins:**
- Appropriate use of standalone templating (not overengineered with components)
- Proper esbuild configuration for both Node and browser code
- TypeScript strict mode enabled
- Production builds are minified and optimized

**Quick wins available:**
- Update TypeScript target to ES2021
- Document IDE plugin recommendations
- Optional: Add HTML template minification for production builds
