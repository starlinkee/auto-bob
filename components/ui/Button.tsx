import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-ink hover:brightness-95",
  secondary: "border-2 border-ink bg-surface text-ink hover:bg-surface-muted",
  ghost: "bg-transparent text-ink hover:bg-surface-muted",
};

type CommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  id?: string;
};
type ButtonProps = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof CommonProps
  >;
type AnchorProps = CommonProps & { href: string; "aria-label"?: string };

export function Button(props: ButtonProps | AnchorProps) {
  const { variant = "primary", className = "", children, ...rest } = props;
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2 font-semibold transition-colors ${variants[variant]} ${className}`;

  if (typeof rest.href === "string") {
    const { href, ...anchorRest } = rest as Omit<AnchorProps, keyof CommonProps> & {
      href: string;
      id?: string;
    };
    if (href.startsWith("/")) {
      return (
        <Link href={href} className={classes} {...anchorRest}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorRest}>
        {children}
      </a>
    );
  }

  const { type = "button", ...buttonRest } = rest as Omit<ButtonProps, keyof CommonProps> & {
    id?: string;
  };
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
