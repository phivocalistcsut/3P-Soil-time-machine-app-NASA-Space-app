import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is a client-heavy interactive tool (localStorage state, WebGL map),
  // so Cache Components / partial prefetching are left off.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
