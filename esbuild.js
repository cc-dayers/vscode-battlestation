const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * Plugin to load CSS files as text strings for embedding in webviews
 * @type {import('esbuild').Plugin}
 */
const cssTextLoaderPlugin = {
  name: "css-text-loader",
  setup(build) {
    build.onLoad({ filter: /codicon\.css$/ }, async (args) => {
      const fs = require("fs");
      const css = await fs.promises.readFile(args.path, "utf8");
      return {
        contents: `export default ${JSON.stringify(css)}`,
        loader: "js",
      };
    });
  },
};

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher
 * in VS Code can understand.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      if (result.errors.length === 0) {
        console.log("[watch] build finished ✓");
      } else {
        console.log("[watch] build finished with errors");
      }
    });
  },
};

async function main() {
  const extensionCtx = await esbuild.context({
    entryPoints: ["src/extension.ts"],
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outfile: "dist/extension.js",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [cssTextLoaderPlugin, esbuildProblemMatcherPlugin],
  });

  const webviewCtx = await esbuild.context({
    entryPoints: ["src/webview/settingsView.ts"],
    bundle: true,
    format: "esm",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "browser",
    outdir: "media",
    logLevel: "silent",
  });

  if (watch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    console.log("Watching for changes...");
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await extensionCtx.dispose();
    await webviewCtx.dispose();
    console.log("Build complete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
