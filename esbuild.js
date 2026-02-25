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
 * @param {string} name - Context name
 * @param {boolean} silentStatus - If true, suppressed start/end messages (errors still shown)
 * @returns {import('esbuild').Plugin}
 */
const createProblemMatcherPlugin = (name, silentStatus = false) => ({
  name: "esbuild-problem-matcher",
  setup(build) {
    build.onStart(() => {
      if (!silentStatus) {
        console.log(`[watch] build started`);
      }
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        if (location) {
          console.error(`    ${location.file}:${location.line}:${location.column}:`);
        }
      });
      if (!silentStatus) {
        if (result.errors.length === 0) {
          console.log(`[watch] build finished ✓`);
        } else {
          console.log(`[watch] build finished with errors`);
        }
      }
    });
  },
});

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
    plugins: [cssTextLoaderPlugin, createProblemMatcherPlugin("extension", false)],
  });

  const webviewCtx = await esbuild.context({
    entryPoints: ["src/webview/settingsView.ts", "src/webview/mainView.ts"],
    bundle: true,
    format: "esm",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "browser",
    outdir: "media",
    logLevel: "silent",
    conditions: production ? [] : ["development"],
  });

  // Copy media assets
  try {
    require("fs").cpSync("node_modules/@vscode/codicons/dist/codicon.ttf", "media/codicon.ttf");
    require("fs").cpSync("node_modules/@vscode/codicons/dist/codicon.css", "media/codicon.css");
  } catch (e) {
    console.error("Failed to copy codicons:", e);
  }

  const { sassPlugin } = require("esbuild-sass-plugin");
  const cssCtx = await esbuild.context({
    entryPoints: ["src/style.scss"],
    bundle: true,
    minify: production,
    outfile: "media/output.css",
    plugins: [sassPlugin(), createProblemMatcherPlugin("css", true)],
    external: ["*.ttf"],
    logLevel: "silent",
  });

  if (watch) {
    await extensionCtx.watch();
    await webviewCtx.watch();
    await cssCtx.watch();
    console.log("[watch] Watching for changes...");
  } else {
    await extensionCtx.rebuild();
    await webviewCtx.rebuild();
    await cssCtx.rebuild();

    await extensionCtx.dispose();
    await webviewCtx.dispose();
    await cssCtx.dispose();

    console.log("Build complete.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

