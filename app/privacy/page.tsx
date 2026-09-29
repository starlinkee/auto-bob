import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getSite } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${getSite().name} handles the personal data you send us.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  const site = getSite();
  const { street, postalCode, city, country } = site.address;
  const mail = (
    <a href={`mailto:${site.email}`} className="underline">
      {site.email}
    </a>
  );
  return (
    <LegalPage
      title="Privacy policy"
      updated={{ iso: "2026-01-15", label: "15 January 2026" }}
      sections={[
        {
          id: "privacy-controller",
          title: "Who we are",
          body: (
            <p>
              The controller of your personal data is {site.name}, {street}, {postalCode} {city},{" "}
              {country}. You can reach us at {mail} or by phone on {site.phone}.
            </p>
          ),
        },
        {
          id: "privacy-data",
          title: "What we collect",
          body: (
            <>
              <p>
                When you send a quote request through the contact form we receive the details you
                enter: your name, e-mail address, phone number, the machine and dates you are
                interested in, and your message.
              </p>
              <p>
                This website does not use advertising cookies or tracking. Our hosting provider may
                keep technical server logs (IP address, time and requested page) for security.
              </p>
            </>
          ),
        },
        {
          id: "privacy-storage",
          title: "How quote-form data is handled",
          body: (
            <p>
              Data from the quote form is only forwarded to us by e-mail. It is not stored on the
              server of this website: no database or file on the server keeps a copy. The e-mail
              lands in our company mailbox, where we keep it only as long as needed to answer you
              and handle the rental.
            </p>
          ),
        },
        {
          id: "privacy-basis",
          title: "Legal basis",
          body: (
            <p>
              We process your data to answer your enquiry and to prepare a rental agreement at your
              request (Article 6(1)(b) GDPR), and for our legitimate interest in running our
              business and keeping records of correspondence (Article 6(1)(f) GDPR).
            </p>
          ),
        },
        {
          id: "privacy-rights",
          title: "Your rights and deletion requests",
          body: (
            <>
              <p>
                You may ask us for access to your data, its correction, restriction or transfer, and
                you may object to processing. You also have the right to complain to the supervisory
                authority in your country.
              </p>
              <p>
                To request deletion, write to {mail} from the address you used in the form. We will
                delete your correspondence from our mailbox and confirm it to you, unless the law
                obliges us to keep it.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
