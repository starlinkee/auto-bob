import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const imageSchema = z.object({
  src: z.string().startsWith("/images/").nullable(),
  alt: z.string(),
});

export type ImageSlot = z.infer<typeof imageSchema>;

/** Fails with a message naming the content file when a non-null image src is missing under public/. */
export function assertImageExists(image: ImageSlot, contentFile: string): void {
  if (image.src === null) return;
  const file = path.join(process.cwd(), "public", image.src);
  if (!fs.existsSync(file)) {
    throw new Error(`${contentFile}: image "${image.src}" does not exist under public/`);
  }
}
