/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIES, keySpecs, specRows } from "@/lib/fleet";
import { parseMachine } from "@/lib/machine-schema";
import { getMachine, getMachines, loadMachines } from "@/lib/machines";

type Sample = { [key: string]: any };
const dir = path.join(process.cwd(), "content", "machines");
const files = fs.readdirSync(dir).filter((file) => file.endsWith(".json"));

function sample(name = "kubota-kx057-4"): Sample {
  return JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), "utf8"));
}

describe("sample fleet", () => {
  it("loads every file in content/machines", () => {
    const machines = getMachines();
    expect(machines).toHaveLength(files.length);
    for (const file of files)
      expect(() => parseMachine(sample(file.slice(0, -5)), file)).not.toThrow();
  });

  it("is sorted by name and looked up by slug", () => {
    const names = getMachines().map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(getMachine("kubota-kx057-4")?.manufacturer).toBe("Kubota");
    expect(getMachine("nope")).toBeUndefined();
  });

  it("covers the catalogue requirements", () => {
    const machines = getMachines();
    expect(new Set(machines.map((m) => m.category))).toEqual(new Set(CATEGORIES.map((c) => c.id)));
    expect(machines.filter((m) => m.featured).length).toBeGreaterThanOrEqual(6);
    expect(machines.some((m) => !m.available)).toBe(true);
    expect(machines.some((m) => !m.operatorAvailable)).toBe(true);
  });
});

describe("schema", () => {
  it("rejects a slug that differs from the file name", () => {
    expect(() => parseMachine(sample(), "other-name.json")).toThrow(/other-name\.json.*slug/);
  });

  it("rejects an invalid slug format", () => {
    expect(() => parseMachine({ ...sample(), slug: "Bad Slug" }, "Bad Slug.json")).toThrow(/slug/);
  });

  it("rejects a gap between tiers", () => {
    const m = sample();
    m.pricing.tiers[1].fromDays = 3;
    expect(() => parseMachine(m, "kubota-kx057-4.json")).toThrow(/pricing\.tiers\.1/);
  });

  it("rejects a tier with a higher perDay than the one before", () => {
    const m = sample();
    m.pricing.tiers[2].perDay = 1000;
    expect(() => parseMachine(m, "kubota-kx057-4.json")).toThrow(/perDay must not increase/);
  });

  it("rejects a second open-ended tier", () => {
    const m = sample();
    m.pricing.tiers[3].toDays = null;
    expect(() => parseMachine(m, "kubota-kx057-4.json")).toThrow(/only the last tier/);
  });

  it("rejects an excavator without bucketCapacityM3", () => {
    const m = sample();
    delete m.specs.bucketCapacityM3;
    expect(() => parseMachine(m, "kubota-kx057-4.json")).toThrow(
      /kubota-kx057-4\.json.*specs\.bucketCapacityM3/,
    );
  });
});

describe("image check", () => {
  it("fails naming the file when a non-null src does not exist under public/", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "machines-"));
    const m = sample();
    m.images = [{ src: "/images/machines/kubota-kx057-4/missing.jpg", alt: "Missing" }];
    fs.writeFileSync(path.join(tmp, "kubota-kx057-4.json"), JSON.stringify(m));
    expect(() => loadMachines(tmp)).toThrow(/kubota-kx057-4\.json.*missing\.jpg/);
    fs.rmSync(tmp, { recursive: true });
  });
});

describe("spec helpers", () => {
  it("formats rows with units, common fields first", () => {
    const rows = specRows(getMachine("kubota-kx057-4")!);
    expect(rows[0]).toEqual({
      key: "operatingWeightKg",
      label: "Operating weight",
      value: "5,700 kg",
    });
    expect(rows[1].value).toBe("32.8 kW (44 HP)");
    expect(rows.find((r) => r.key === "bucketCapacityM3")?.value).toBe("0.18 m³");
    expect(rows.find((r) => r.key === "quickCoupler")?.value).toBe("Yes");
  });

  it("formats 55 kW as 55 kW (74 HP)", () => {
    const rows = specRows(getMachine("volvo-l60h")!);
    expect(rows.find((r) => r.key === "enginePowerKw")?.value).toBe("129 kW (173 HP)");
    const skid = specRows(getMachine("bobcat-s650")!);
    expect(skid.find((r) => r.key === "enginePowerKw")?.value).toBe("55 kW (74 HP)");
  });

  it("omits absent fields", () => {
    const rows = specRows(getMachine("indeco-hp-700")!);
    const keys = rows.map((r) => r.key);
    expect(keys).not.toContain("enginePowerKw");
    expect(keys).not.toContain("fuelType");
    expect(keys).toContain("weightKg");
    expect(rows.every((r) => r.value.length > 0)).toBe(true);
  });

  it("keySpecs returns at most 3 entries", () => {
    for (const m of getMachines()) expect(keySpecs(m).length).toBeLessThanOrEqual(3);
    expect(keySpecs(getMachine("kubota-kx057-4")!).map((s) => s.label)).toEqual([
      "Operating weight",
      "Engine power",
      "Bucket capacity",
    ]);
    expect(keySpecs(getMachine("indeco-hp-700")!)).toEqual([{ label: "Weight", value: "90 kg" }]);
  });
});
