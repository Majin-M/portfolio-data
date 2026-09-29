import type { NextConfig } from "next";

// Site entièrement statique : `next build` écrit le site dans out/,
// publiable sur n'importe quel hébergeur de fichiers (Vercel, GitHub Pages…).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
