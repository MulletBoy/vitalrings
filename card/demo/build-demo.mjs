// Builds dist/demo.html: the demo page with the card bundle inlined (one file, no server needed).
import { readFileSync, writeFileSync } from "node:fs";

const bundle = readFileSync(new URL("../dist/vital-rings-card.js", import.meta.url), "utf8");
if (bundle.includes("</script")) throw new Error("bundle contains a closing script tag");
const page = readFileSync(new URL("./demo.html", import.meta.url), "utf8");
writeFileSync(new URL("../dist/demo.html", import.meta.url), page.replace("/*BUNDLE*/", () => bundle));
console.log("dist/demo.html written");
