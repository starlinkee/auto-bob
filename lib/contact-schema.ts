import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .optional()
  .refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), "Use the format YYYY-MM-DD")
  .transform((value) => (value ? value : undefined));

const optionalDays = z.preprocess(
  (value) => (value === "" || value === null || Number.isNaN(value) ? undefined : value),
  z
    .number("Enter a number of days")
    .int("Enter a whole number of days")
    .min(1, "At least 1 day")
    .max(365, "At most 365 days")
    .optional(),
);

export const contactSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100, "At most 100 characters"),
    company: optionalText(100),
    email: z.string().trim().email("Enter a valid e-mail address"),
    phone: z
      .string()
      .trim()
      .min(6, "Enter a phone number of at least 6 characters")
      .max(30, "At most 30 characters")
      .regex(/^[+0-9() \-]+$/, "Use only digits, spaces and + ( ) -"),
    machines: z.array(z.string()).max(10, "Select at most 10 machines"),
    startDate: optionalDate,
    days: optionalDays,
    delivery: z.boolean(),
    location: z.string().trim().max(200, "At most 200 characters").optional(),
    operator: z.boolean(),
    message: z
      .string()
      .trim()
      .min(10, "Write at least 10 characters")
      .max(5000, "At most 5000 characters"),
    consent: z.literal(true, "You must accept the privacy policy"),
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.delivery) {
      const length = data.location?.length ?? 0;
      if (length < 3) {
        ctx.addIssue({
          code: "custom",
          path: ["location"],
          message: "Enter the delivery location (at least 3 characters)",
        });
      }
    }
  });

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;
