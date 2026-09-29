import fs from "node:fs";
import path from "node:path";
import { assertImageExists } from "@/lib/images";
import { parseMachine, type Machine } from "@/lib/machine-schema";

export type { Machine, Pricing } from "@/lib/machine-schema";

const MACHINES_DIR = path.join(process.cwd(), "content", "machines");

/** Reads and validates every content/machines/*.json file; throws naming the file on any problem. */
export function loadMachines(dir: string = MACHINES_DIR): Machine[] {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => {
      let raw: unknown;
      try {
        raw = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
      } catch (error) {
        throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
      const machine = parseMachine(raw, file);
      for (const image of machine.images) assertImageExists(image, `content/machines/${file}`);
      return machine;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

let cache: Machine[] | undefined;

export function getMachines(): Machine[] {
  cache ??= loadMachines();
  return cache;
}

export function getMachine(slug: string): Machine | undefined {
  return getMachines().find((machine) => machine.slug === slug);
}
