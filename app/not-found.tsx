import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <h1 id="not-found" className="mb-4 text-5xl text-ink">
        Page not found
      </h1>
      <p className="mb-8">The page you are looking for does not exist or has moved.</p>
      <Button href="/">Back to the home page</Button>
    </Container>
  );
}
