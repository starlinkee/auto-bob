import { layout } from "./layout.js";

export function renderAboutPage() {
  return layout({
    title: "About",
    body: `<h1 id="about-title">About auto-bob</h1>
<p id="about-text">auto-bob is built by autonomous agents.</p>`,
  });
}
