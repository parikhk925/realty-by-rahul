"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  Check,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PropertyPdf } from "@/lib/property-data";
import { cn } from "@/lib/utils";

interface ListingPdfUploaderProps {
  label: string;
  description: string;
  value?: PropertyPdf;
  onChange: (value: PropertyPdf | undefined) => void;
}

function safeName(value: string) {
  const base = value.replace(/\.pdf$/i, "");
  const safe =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 72) || "property-document";
  return `${safe}.pdf`;
}

export function ListingPdfUploader({
  label,
  description,
  value,
  onChange,
}: ListingPdfUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const uploadPdf = async (file: File) => {
    setError("");
    if (file.type !== "application/pdf") {
      setError("Choose a PDF document.");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      setError("PDFs must be smaller than 40 MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      // Straight from the browser to Blob. Posting through the API route
      // capped every upload at Vercel's 4.5MB function body limit, which is
      // far below a real developer brochure.
      const blob = await upload(
        `property-documents/${Date.now()}-${safeName(file.name)}`,
        file,
        {
          access: "public",
          handleUploadUrl: "/api/property-documents/upload",
          contentType: "application/pdf",
          onUploadProgress: ({ percentage }) =>
            setProgress(Math.min(99, percentage)),
        },
      );
      onChange({ name: file.name.slice(0, 100), url: blob.url });
      setProgress(100);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The PDF could not be uploaded.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="rounded-2xl border border-primary/10 bg-[linear-gradient(145deg,rgba(245,249,255,.96),rgba(255,255,255,.96))] p-4">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadPdf(file);
        }}
      />
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary",
            value && "bg-emerald-500/10 text-emerald-600",
          )}
        >
          {value ? <Check className="size-4" /> : <FileText className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold">{label}</p>
          <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
            {description}
          </p>
        </div>
        <span className="rounded-full border bg-white px-2 py-1 text-[8px] font-semibold text-muted-foreground">
          Optional
        </span>
      </div>

      {value ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border bg-white p-2.5 shadow-sm">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/[0.08] text-rose-600">
            <FileText className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold">{value.name}</p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
              PDF document
            </p>
          </div>
          <Button asChild type="button" variant="ghost" size="icon-sm">
            <a href={value.url} target="_blank" rel="noreferrer" aria-label={`View ${label}`}>
              <ExternalLink />
            </a>
          </Button>
          <Button asChild type="button" variant="ghost" size="icon-sm">
            <a href={value.url} download aria-label={`Download ${label}`}>
              <Download />
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={() => onChange(undefined)}
            aria-label={`Remove ${label}`}
          >
            <Trash2 />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-11 w-full rounded-xl border-dashed bg-white"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <UploadCloud />
          )}
          {uploading ? `Uploading… ${Math.round(progress)}%` : `Add ${label.toLowerCase()}`}
        </Button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-[9px] font-medium text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
