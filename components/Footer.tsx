import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { MapEmbed } from "@/components/MapEmbed";
import { NAV_ITEMS } from "@/lib/nav";
import { directionsUrl, getSite, telHref } from "@/lib/site";

const linkClass = "text-on-charcoal underline-offset-4 hover:underline";

export function Footer() {
  const site = getSite();
  const { street, postalCode, city, country } = site.address;
  return (
    <footer className="bg-charcoal text-on-charcoal">
      <Container className="grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div id="footer-contact">
          <h2 className="mb-3 text-2xl text-on-charcoal">Contact</h2>
          <address className="not-italic">
            {street}
            <br />
            {postalCode} {city}, {country}
          </address>
          <p className="mt-3">
            <a href={telHref(site.phone)} className={linkClass}>
              {site.phone}
            </a>
          </p>
          <p>
            <a href={`mailto:${site.email}`} className={linkClass}>
              {site.email}
            </a>
          </p>
          <p className="mt-3">
            <a href={directionsUrl(site)} className={linkClass} rel="noopener noreferrer">
              Get directions
            </a>
          </p>
        </div>
        <div id="footer-hours">
          <h2 className="mb-3 text-2xl text-on-charcoal">Opening hours</h2>
          <ul className="space-y-1">
            {site.hours.map((entry) => (
              <li key={entry.days}>
                {entry.days}: {entry.open}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div id="footer-links">
            <h2 className="mb-3 text-2xl text-on-charcoal">Explore</h2>
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div id="footer-social" className="mt-6">
            <h2 className="mb-3 text-2xl text-on-charcoal">Follow us</h2>
            <ul className="space-y-1">
              {site.socials.map((social) => (
                <li key={social.url}>
                  <a href={social.url} className={linkClass} rel="noopener noreferrer">
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div id="footer-map">
          <h2 className="mb-3 text-2xl text-on-charcoal">Find us</h2>
          <MapEmbed variant="compact" />
        </div>
      </Container>
      <div className="border-t border-body">
        <Container className="flex flex-col gap-2 py-6 text-sm md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul id="footer-legal" className="flex gap-4">
            <li>
              <Link href="/privacy" className={linkClass}>
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Terms
              </Link>
            </li>
          </ul>
        </Container>
      </div>
    </footer>
  );
}
