import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // The build trace is produced on whichever machine runs the build. Built on
  // Windows it captured sharp's JavaScript but none of its native binaries, so
  // every route that touches sharp threw "Could not load the sharp module
  // using the linux-x64 runtime" and returned 500 in production. Naming the
  // Linux binaries here puts them in the deployed bundle whatever the build
  // host is.
  // MuPDF is WebAssembly loaded at runtime, so it must not be bundled — and
  // the 10MB .wasm has to be traced into the function alongside it.
  serverExternalPackages: ["mupdf"],
  outputFileTracingIncludes: {
    "/api/listings/**": [
      "./node_modules/@img/sharp-linux-x64/**",
      "./node_modules/@img/sharp-libvips-linux-x64/**",
      "./node_modules/mupdf/dist/**",
    ],
    "/api/projects/**": [
      "./node_modules/@img/sharp-linux-x64/**",
      "./node_modules/@img/sharp-libvips-linux-x64/**",
    ],
    // The dossier route generates the PDF itself when no file is stored. That
    // path is pure JS today, but sampling a brochure's accent colour pulls in
    // MuPDF, so trace it here rather than discover the 500 in production.
    "/dossier/**": ["./node_modules/mupdf/dist/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
