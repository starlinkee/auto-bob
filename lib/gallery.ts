import { z } from "zod";
import galleryJson from "../content/gallery.json" with { type: "json" };
import { assertImageExists, imageSchema } from "@/lib/images";

export const GALLERY_CATEGORIES = [
  { id: "machines", label: "Machines" },
  { id: "job-sites", label: "Job sites" },
  { id: "delivery", label: "Delivery" },
  { id: "team", label: "Team" },
] as const;

export type GalleryCategoryId = (typeof GALLERY_CATEGORIES)[number]["id"];

export type GalleryItem = {
  id: string;
  image: { src: string | null; alt: string };
  caption: string;
  category: GalleryCategoryId;
};

const categoryIds = GALLERY_CATEGORIES.map((c) => c.id) as [
  GalleryCategoryId,
  ...GalleryCategoryId[],
];

const gallerySchema = z.array(
  z.object({
    id: z.string().min(1),
    image: imageSchema,
    caption: z.string().min(1),
    category: z.enum(categoryIds),
  }),
);

/** Server only: reads and validates content/gallery.json, in file order. */
export function getGallery(): GalleryItem[] {
  const items = gallerySchema.parse(galleryJson);
  for (const item of items) assertImageExists(item.image, "content/gallery.json");
  return items;
}
