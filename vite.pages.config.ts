import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { catalogConfigs, products } from "./data/catalog";
import { policies } from "./data/policies";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isAccountSite = repositoryName?.endsWith(".github.io");
const base = process.env.GITHUB_ACTIONS && repositoryName && !isAccountSite
  ? `/${repositoryName}/`
  : "/";

export default defineConfig({
  root: "github-pages",
  publicDir: "../public",
  base,
  resolve: {
    alias: {
      "@": projectRoot,
      "next/link": resolve(projectRoot, "github-pages/link.tsx"),
    },
  },
  plugins: [react(), {
    name: "pages-route-entrypoints",
    async closeBundle() {
      const output = resolve(projectRoot, "dist-pages");
      const html = await readFile(resolve(output, "index.html"), "utf8");
      const routes = [
        "our-philosophy", "design-your-piece", "consultation", "wishlist", "bag", "admin",
        ...Object.keys(catalogConfigs).map((slug) => `collections/${slug}`),
        ...products.map((product) => `products/${product.id}`),
        ...policies.map((policy) => `policies/${policy.slug}`),
      ];
      await Promise.all(routes.map(async (route) => {
        await mkdir(resolve(output, route), { recursive: true });
        await writeFile(resolve(output, route, "index.html"), html);
      }));
      await writeFile(resolve(output, "404.html"), html);
      await writeFile(resolve(output, ".nojekyll"), "");
    },
  }],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
  },
});
