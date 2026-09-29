import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderNav } from "@/components/HeaderNav";
import { getSite, telHref } from "@/lib/site";

export function Header() {
  const site = getSite();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface">
      <Container className="relative flex h-16 items-center gap-3">
        <Link
          id="nav-home"
          href="/"
          className="mr-auto shrink-0 lg:mr-0"
          aria-label={`${site.name} – home`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={140} height={31} className="h-8 w-auto" />
        </Link>
        <HeaderNav />
        <div id="header-actions" className="order-2 flex items-center gap-2 lg:order-3 lg:ml-auto">
          <ThemeToggle />
          <a
            id="header-phone"
            href={telHref(site.phone)}
            aria-label={`Call ${site.phone}`}
            className="hidden px-2 py-2 font-semibold text-ink sm:inline"
          >
            {site.phone}
          </a>
          <Button id="header-quote" href="/contact" className="px-3 sm:px-5">
            Get a quote
          </Button>
        </div>
      </Container>
    </header>
  );
}
