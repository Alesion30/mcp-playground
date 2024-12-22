import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  bundle: true,
  format: "cjs",
  minify: true,
  platform: "node",
});
