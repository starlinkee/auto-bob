import Image from "next/image";
import { ImagePlaceholder } from "@/components/ImagePlaceholder";

type SmartImageProps = {
  image: { src: string | null; alt: string };
  slot: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function SmartImage({
  image,
  slot,
  width,
  height,
  sizes,
  priority,
  className,
}: SmartImageProps) {
  if (image.src === null) {
    return (
      <ImagePlaceholder
        label={slot}
        width={width}
        height={height}
        alt={image.alt || undefined}
        className={className}
      />
    );
  }
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
