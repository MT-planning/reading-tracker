import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const watch = process.argv.includes("--watch");

const banner = `/*! ${pkg.name} v${pkg.version} | MIT License | (c) MT-planning, Ltd. */`;

/** CSS を minify して文字列として取り込む */
const cssText = {
  name: "css-text",
  setup(build) {
    build.onLoad({ filter: /.css$/ }, async (args) => {
      const { code } = await esbuild.transform(readFileSync(args.path, "utf8"), { loader: "css", minify: true });
      return { contents: code.trim(), loader: "text" };
    });
  },
};

const common = {
  bundle: true,
  target: ["es2020", "chrome90", "firefox90", "safari15"],
  plugins: [cssText],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  banner: { js: banner },
  legalComments: "none",
  charset: "utf8",
  logLevel: "info",
};

const builds = [
  { ...common, entryPoints: ["src/index.js"], format: "esm", outfile: "dist/reading-tracker.esm.js" },
  { ...common, entryPoints: ["src/browser.js"], format: "iife", outfile: "dist/reading-tracker.js" },
  { ...common, entryPoints: ["src/browser.js"], format: "iife", outfile: "dist/reading-tracker.min.js", minify: true },
];

if (watch) {
  const contexts = await Promise.all(builds.map((b) => esbuild.context(b)));
  await Promise.all(contexts.map((ctx) => ctx.watch()));
  console.log("watching for changes…");
} else {
  await Promise.all(builds.map((b) => esbuild.build(b)));
}
