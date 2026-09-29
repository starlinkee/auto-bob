import http from "node:http";
import { layout } from "./layout.js";
import { handleRequest } from "./site.js";
import { handleHealth } from "./health.js";
import { renderAboutPage } from "./about-page.js";

export function renderPage() {
  return layout({
    title: "Hello",
    body: `<h1 id="greeting">Hello, world!</h1>`,
  });
}

const port = Number(process.env.PORT || 3000);

http
  .createServer(async (req, res) => {
    try {
      if (new URL(req.url, "http://localhost").pathname === "/health") return handleHealth(req, res);
      await handleRequest(req, res, { "/": renderPage, "/about": renderAboutPage });
    } catch {
      if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "internal error" }));
    }
  })
  .listen(port, () => console.log(`listening on http://localhost:${port}`));
