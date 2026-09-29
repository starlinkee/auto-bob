# Machines

Each machine is one JSON file in this folder. The file name (without `.json`) must equal the `slug` inside it, and the slug must be lower-case kebab-case (`kubota-kx057-4`). The site validates every file at build time; an error names the file and the path of the bad field (for example `cat-320-gc.json: invalid machine: specs.bucketCapacityM3: ...`).

## Add a machine

1. Copy the sample of the same `category` (for example `kubota-kx057-4.json` for an excavator) to `content/machines/<slug>.json`.
2. Change `slug`, `name`, `manufacturer`, `model`, `year`, descriptions, `specs`, `features`, `included`, `notIncluded` and `pricing`.
3. Set the flags: `featured` (shown on the home page), `available` (`false` shows "Currently rented"), `operatorRequired` and `operatorAvailable`. When `operatorAvailable` is `false`, set `pricing.extras.operatorPerDay` to `null`.
4. Keep `datasheetUrl` as `null` unless you have a datasheet link.

Categories: `excavator`, `loader`, `skid-steer`, `dumper`, `roller`, `telehandler`, `compactor`, `attachment`. Each category has its own required `specs` fields (see `lib/machine-schema.ts`); weight, power and fuel are optional only for attachments.

## Change a price

Edit `pricing.tiers`. Tiers must start at day 1, be contiguous (`fromDays` = previous `toDays` + 1), only the last tier has `"toDays": null`, and `perDay` may never increase from one tier to the next. Prices are net; VAT is added using `pricing.vatRate` (`0.23`). `deposit`, `extras.operatorPerDay` (`null` = no operator), `extras.deliveryPerKm` and `extras.extraHour` are in the same currency.

## Add photos

1. Put the files under `public/images/machines/<slug>/`, for example `public/images/machines/<slug>/main.jpg` (4:3, about 1200×900).
2. In the machine's `images` array, set `src` to the path starting with `/images/` and write a descriptive `alt`:

   ```json
   { "src": "/images/machines/<slug>/main.jpg", "alt": "Kubota KX057-4 digging a trench" }
   ```

3. The first image is the main photo. While `src` is `null`, a labelled placeholder is shown. A `src` that does not exist under `public/` fails the build with the file name in the message.
