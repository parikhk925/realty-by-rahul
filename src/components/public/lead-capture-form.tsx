"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { submitLead } from "@/app/lead-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface LeadCaptureFormProps {
  propertyId?: string;
  propertyTitle?: string;
  source?: string;
  /** Rentals ask about move-in date rather than purchase budget. */
  rental?: boolean;
}

const saleBudgets = [
  "Under AED 1M",
  "AED 1M – 2M",
  "AED 2M – 5M",
  "AED 5M – 10M",
  "AED 10M+",
];
const rentBudgets = [
  "Under AED 60k/yr",
  "AED 60k – 120k/yr",
  "AED 120k – 250k/yr",
  "AED 250k – 500k/yr",
  "AED 500k+/yr",
];
const timelines = [
  "Ready to proceed",
  "Within 1 month",
  "1 – 3 months",
  "3 – 6 months",
  "Just exploring",
];

export function LeadCaptureForm({
  propertyId,
  propertyTitle,
  source = "listing",
  rental = false,
}: LeadCaptureFormProps) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");

  const submit = async (formData: FormData) => {
    setPending(true);
    setError("");
    formData.set("budget", budget);
    formData.set("timeline", timeline);
    if (propertyId) formData.set("propertyId", propertyId);
    if (propertyTitle) formData.set("propertyTitle", propertyTitle);
    formData.set("source", source);
    const result = await submitLead(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Request received
          </p>
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
            Your advisor will be in touch shortly with availability, current
            pricing and the payment options for this property.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-name" className="text-[10px]">
            Your name
          </Label>
          <Input
            id="lead-name"
            name="name"
            required
            placeholder="Full name"
            className="h-11 rounded-xl bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-phone" className="text-[10px]">
            Mobile / WhatsApp
          </Label>
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            placeholder="+971 50 123 4567"
            className="h-11 rounded-xl bg-white"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-email" className="text-[10px]">
          Email <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="lead-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          className="h-11 rounded-xl bg-white"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px]">{rental ? "Rent budget" : "Budget"}</Label>
          <Select value={budget} onValueChange={setBudget}>
            <SelectTrigger className="h-11 w-full rounded-xl bg-white">
              <SelectValue placeholder="Select a range" />
            </SelectTrigger>
            <SelectContent>
              {(rental ? rentBudgets : saleBudgets).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px]">Timeline</Label>
          <Select value={timeline} onValueChange={setTimeline}>
            <SelectTrigger className="h-11 w-full rounded-xl bg-white">
              <SelectValue placeholder="When are you looking?" />
            </SelectTrigger>
            <SelectContent>
              {timelines.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lead-message" className="text-[10px]">
          Anything specific? <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="lead-message"
          name="message"
          rows={2}
          placeholder="Preferred view, floor, unit type…"
          className="min-h-16 resize-y rounded-xl bg-white"
        />
      </div>
      {error && (
        <p role="status" className="text-[10px] font-medium text-destructive">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#4280ff,#174ed6)] text-[11px] shadow-[0_14px_32px_rgba(184,134,47,.28)]"
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <Send className="size-4" />}
        {pending ? "Sending…" : "Request details"}
      </Button>
      <p className="text-[8px] leading-4 text-muted-foreground">
        Your details are shared only with your Realty by Rahul advisor and are
        never published.
      </p>
    </form>
  );
}
