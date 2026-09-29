import type { MetadataRoute } from "next";
import { getMachines } from "@/lib/machines";

const STATIC_PATHS = [
  "/",
  "/fleet",
  "/pricing",
  "/gallery",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const paths = [...STATIC_PATHS, ...getMachines().map((machine) => `/fleet/${machine.slug}`)];
  return paths.map((path) => ({ url: path === "/" ? `${base}/` : `${base}${path}` }));
}
