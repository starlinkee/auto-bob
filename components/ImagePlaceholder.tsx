type ImagePlaceholderProps = {
  label: string;
  width: number;
  height: number;
  alt?: string;
  className?: string;
};

export function ImagePlaceholder({
  label,
  width,
  height,
  alt,
  className = "",
}: ImagePlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={alt ?? label}
      data-testid="image-placeholder"
      data-slot={label}
      className={`flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-surface-muted p-4 text-center text-sm text-body ${className}`}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <svg
        aria-hidden="true"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </svg>
      <span>{label}</span>
    </div>
  );
}
