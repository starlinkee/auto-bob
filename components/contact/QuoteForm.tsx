"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/Button";
import { contactSchema, type ContactData, type ContactInput } from "@/lib/contact-schema";

type MachineOption = { slug: string; name: string };

const inputClass =
  "mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-ink aria-[invalid=true]:border-2 aria-[invalid=true]:border-red-700";
const labelClass = "block font-semibold text-ink";
const errorClass = "mt-1 text-sm font-semibold text-red-700 dark:text-red-400";

function initialValues(params: URLSearchParams, machines: MachineOption[]): ContactInput {
  const known = new Set(machines.map((machine) => machine.slug));
  const selected = [...new Set(params.getAll("machine"))].filter((slug) => known.has(slug));
  const rawDays = params.get("days");
  const days = rawDays && /^\d+$/.test(rawDays) ? Number(rawDays) : undefined;
  return {
    name: "",
    company: "",
    email: "",
    phone: "",
    machines: selected.slice(0, 10),
    startDate: "",
    days: days !== undefined && days >= 1 && days <= 365 ? days : undefined,
    delivery: false,
    location: "",
    operator: false,
    message: "",
    consent: false as unknown as true,
    website: "",
  };
}

function FieldError({
  field,
  errors,
}: {
  field: keyof ContactInput;
  errors: FieldErrors<ContactInput>;
}) {
  const message = errors[field]?.message;
  if (typeof message !== "string") return null;
  return (
    <p id={`contact-${field}-error`} className={errorClass}>
      {message}
    </p>
  );
}

export function QuoteForm({ machines }: { machines: MachineOption[] }) {
  const searchParams = useSearchParams();
  const [defaults] = useState(() => initialValues(searchParams, machines));
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm<ContactInput, unknown, ContactData>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaults,
  });

  const delivery = useWatch({ control, name: "delivery" });
  const selectedMachines = useWatch({ control, name: "machines" }) ?? [];

  const describedBy = (field: keyof ContactInput) =>
    errors[field] ? `contact-${field}-error` : undefined;
  const invalid = (field: keyof ContactInput) => (errors[field] ? true : undefined);

  async function onSubmit(values: ContactData) {
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        reset(initialValues(new URLSearchParams(), machines));
        setStatus("success");
        return;
      }
      if (response.status === 400) {
        const body = (await response.json().catch(() => null)) as {
          fieldErrors?: Record<string, string[]>;
        } | null;
        for (const [field, messages] of Object.entries(body?.fieldErrors ?? {})) {
          if (messages[0]) setError(field as keyof ContactInput, { message: messages[0] });
        }
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  function toggleMachine(slug: string, checked: boolean) {
    const next = checked
      ? [...selectedMachines, slug]
      : selectedMachines.filter((current) => current !== slug);
    setValue("machines", next, { shouldValidate: true });
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {status === "success" ? (
        <p
          id="contact-success"
          role="status"
          className="rounded-md border border-border bg-surface-muted p-4 font-semibold text-ink"
        >
          Thank you! We have received your request and will reply within one business day.
        </p>
      ) : null}
      {status === "error" ? (
        <p
          id="contact-error"
          role="alert"
          className="rounded-md border-2 border-red-700 p-4 font-semibold text-red-700 dark:text-red-400"
        >
          Sorry, we could not send your request. Please check your input and try again, or call us.
        </p>
      ) : null}

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          className={inputClass}
          aria-invalid={invalid("name")}
          aria-describedby={describedBy("name")}
          {...register("name")}
        />
        <FieldError field="name" errors={errors} />
      </div>

      <div>
        <label htmlFor="contact-company" className={labelClass}>
          Company (optional)
        </label>
        <input
          id="contact-company"
          type="text"
          autoComplete="organization"
          className={inputClass}
          aria-invalid={invalid("company")}
          aria-describedby={describedBy("company")}
          {...register("company")}
        />
        <FieldError field="company" errors={errors} />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          E-mail
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          className={inputClass}
          aria-invalid={invalid("email")}
          aria-describedby={describedBy("email")}
          {...register("email")}
        />
        <FieldError field="email" errors={errors} />
      </div>

      <div>
        <label htmlFor="contact-phone" className={labelClass}>
          Phone
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          className={inputClass}
          aria-invalid={invalid("phone")}
          aria-describedby={describedBy("phone")}
          {...register("phone")}
        />
        <FieldError field="phone" errors={errors} />
      </div>

      <fieldset
        id="contact-machines"
        aria-describedby={describedBy("machines")}
        className="rounded-md border border-border p-4"
      >
        <legend className="px-1 font-semibold text-ink">Machines (optional)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {machines.map((machine) => (
            <label key={machine.slug} className="flex items-center gap-2 text-body">
              <input
                type="checkbox"
                name="machines"
                value={machine.slug}
                checked={selectedMachines.includes(machine.slug)}
                onChange={(event) => toggleMachine(machine.slug, event.target.checked)}
                className="size-5"
              />
              {machine.name}
            </label>
          ))}
        </div>
        <FieldError field="machines" errors={errors} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-start" className={labelClass}>
            Start date (optional)
          </label>
          <input
            id="contact-start"
            type="date"
            className={inputClass}
            aria-invalid={invalid("startDate")}
            aria-describedby={describedBy("startDate")}
            {...register("startDate")}
          />
          <FieldError field="startDate" errors={errors} />
        </div>
        <div>
          <label htmlFor="contact-days" className={labelClass}>
            Rental days (optional)
          </label>
          <input
            id="contact-days"
            type="number"
            min={1}
            max={365}
            step={1}
            inputMode="numeric"
            className={inputClass}
            aria-invalid={invalid("days")}
            aria-describedby={describedBy("days")}
            {...register("days", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          />
          <FieldError field="days" errors={errors} />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 font-semibold text-ink">
          <input
            id="contact-delivery"
            type="checkbox"
            className="size-5"
            {...register("delivery")}
          />
          I need delivery
        </label>
      </div>

      {delivery ? (
        <div>
          <label htmlFor="contact-location" className={labelClass}>
            Delivery location
          </label>
          <input
            id="contact-location"
            type="text"
            autoComplete="street-address"
            required
            className={inputClass}
            aria-invalid={invalid("location")}
            aria-describedby={describedBy("location")}
            {...register("location")}
          />
          <FieldError field="location" errors={errors} />
        </div>
      ) : null}

      <div>
        <label className="flex items-center gap-2 font-semibold text-ink">
          <input
            id="contact-operator"
            type="checkbox"
            className="size-5"
            {...register("operator")}
          />
          I need an operator
        </label>
      </div>

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          rows={6}
          className={inputClass}
          aria-invalid={invalid("message")}
          aria-describedby={describedBy("message")}
          {...register("message")}
        />
        <FieldError field="message" errors={errors} />
      </div>

      <div>
        <label className="flex items-start gap-2 text-body">
          <input
            id="contact-consent"
            type="checkbox"
            className="mt-1 size-5"
            aria-invalid={invalid("consent")}
            aria-describedby={describedBy("consent")}
            {...register("consent")}
          />
          <span>
            I have read the{" "}
            <Link href="/privacy" className="font-semibold text-ink underline">
              privacy policy
            </Link>{" "}
            and agree to be contacted about my request.
          </span>
        </label>
        <FieldError field="consent" errors={errors} />
      </div>

      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <Button id="contact-submit" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
