"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ImagePlus,
  LoaderCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const maximumImages = 8;

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "property-photo";
}

async function compressImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }

  const bitmap = await createImageBitmap(file);
  const maximumDimension = 1600;
  const scale = Math.min(
    1,
    maximumDimension / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the photo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result ? resolve(result) : reject(new Error("Photo compression failed.")),
      "image/webp",
      0.84,
    );
  });

  return new File([blob], `${safeFileName(file.name)}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

interface ListingImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ListingImageUploader({
  images,
  onChange,
}: ListingImageUploaderProps) {
  const galleryInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const chooseFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const available = maximumImages - images.length;
    if (available <= 0) {
      setMessage(`A listing can include up to ${maximumImages} photos.`);
      return;
    }

    const files = Array.from(fileList).slice(0, available);
    setUploading(true);
    setProgress(4);
    setMessage("");
    const uploadedUrls: string[] = [];

    try {
      for (const [index, sourceFile] of files.entries()) {
        const file = await compressImage(sourceFile);
        const timestamp = Date.now();
        const blob = await upload(
          `property-images/${timestamp}-${index}-${file.name}`,
          file,
          {
            access: "public",
            handleUploadUrl: "/api/property-images/upload",
            contentType: "image/webp",
            onUploadProgress: ({ percentage }) => {
              const completedShare = (index / files.length) * 100;
              setProgress(
                Math.min(
                  99,
                  completedShare + percentage / Math.max(files.length, 1),
                ),
              );
            },
          },
        );
        uploadedUrls.push(blob.url);
      }
      onChange([...images, ...uploadedUrls]);
      setProgress(100);
      setMessage(
        `${uploadedUrls.length} ${uploadedUrls.length === 1 ? "photo" : "photos"} uploaded.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The photos could not be uploaded. Please try again.",
      );
    } finally {
      setUploading(false);
      if (galleryInput.current) galleryInput.current.value = "";
      if (cameraInput.current) cameraInput.current.value = "";
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-primary/12 bg-primary/[0.025] p-3.5">
      <input
        ref={galleryInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => void chooseFiles(event.target.files)}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        onChange={(event) => void chooseFiles(event.target.files)}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold">Property photos</p>
          <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
            The first photo becomes the cover. Photos are optimized before upload.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-background px-2 py-1 text-[8px] font-semibold text-muted-foreground shadow-sm">
          {images.length}/{maximumImages}
        </span>
      </div>

      {images.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-xl border bg-muted",
                index === 0 && "ring-2 ring-primary/45 ring-offset-1 ring-offset-background",
              )}
            >
              <Image
                src={image}
                alt={`Property photo ${index + 1}`}
                fill
                sizes="140px"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[7px] font-semibold text-background backdrop-blur">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-0.5 rounded-lg bg-black/55 p-0.5 opacity-100 backdrop-blur-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 text-white hover:bg-white/15 hover:text-white"
                  disabled={index === 0}
                  onClick={() => moveImage(index, -1)}
                  aria-label={`Move photo ${index + 1} earlier`}
                >
                  <ArrowLeft className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => onChange(images.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <Trash2 className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-6 text-white hover:bg-white/15 hover:text-white"
                  disabled={index === images.length - 1}
                  onClick={() => moveImage(index, 1)}
                  aria-label={`Move photo ${index + 1} later`}
                >
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <div className="mt-3 rounded-xl border bg-background p-3">
          <div className="mb-2 flex items-center justify-between text-[9px] font-medium">
            <span className="flex items-center gap-1.5">
              <LoaderCircle className="size-3 animate-spin text-primary" />
              Optimizing and uploading
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-background"
          disabled={uploading || images.length >= maximumImages}
          onClick={() => cameraInput.current?.click()}
        >
          <Camera className="size-4" /> Take photo
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl bg-background"
          disabled={uploading || images.length >= maximumImages}
          onClick={() => galleryInput.current?.click()}
        >
          <ImagePlus className="size-4" /> Choose photos
        </Button>
      </div>

      {message && (
        <p
          role="status"
          className={cn(
            "mt-2 flex items-center gap-1.5 text-[9px]",
            message.includes("uploaded")
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          <Sparkles className="size-3" />
          {message}
        </p>
      )}
    </div>
  );
}
