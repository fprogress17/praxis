"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  FileText,
  GripHorizontal,
  GripVertical,
  ImageIcon,
  Loader2,
  Pencil,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteFileRecord,
  updateFileContent,
  uploadFiles as uploadFilesAction,
} from "@/app/actions/files";
import type { FileRow } from "@/lib/types/file";

type FilesPanelProps = {
  scope: "workspace" | "channel" | "video";
  channelId: string | null;
  videoId: string | null;
  files: FileRow[];
  dataConfigured: boolean;
  contextTitle: string;
  contextDetail: string;
  contextLabel: string;
  contextBody: string;
};

type PreviewState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "text"; text: string }
  | { status: "object"; url: string; kind: "image" | "pdf" | "download" };

type MarkdownMode = "reader" | "edit";
type VerticalResizeTarget = "image-explorer" | "explorer-context";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function extension(name: string) {
  const last = name.split(".").pop();
  return last && last !== name ? last.toLowerCase() : "";
}

function isTextFile(file: Pick<FileRow, "name" | "mime_type">) {
  const ext = extension(file.name);
  return (
    file.mime_type.startsWith("text/") ||
    file.mime_type === "application/json" ||
    file.mime_type === "application/xml" ||
    ["txt", "md", "markdown", "json", "csv", "log", "xml"].includes(ext)
  );
}

function isMarkdownFile(file: Pick<FileRow, "name" | "mime_type">) {
  const ext = extension(file.name);
  return ["md", "markdown"].includes(ext) || file.mime_type === "text/markdown";
}

function isImageFile(file: Pick<FileRow, "name" | "mime_type">) {
  const ext = extension(file.name);
  return file.mime_type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
}

function previewKind(file: Pick<FileRow, "name" | "mime_type">): "text" | "image" | "pdf" | "download" {
  const ext = extension(file.name);
  if (isTextFile(file)) return "text";
  if (isImageFile(file)) return "image";
  if (file.mime_type === "application/pdf" || ext === "pdf") return "pdf";
  return "download";
}

function MarkdownReader({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className="space-y-4 p-4 text-body leading-7 text-foreground">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const first = lines[0] ?? "";
        const heading = first.match(/^(#{1,3})\s+(.+)$/);
        const key = `${blockIndex}:${first}`;

        if (heading) {
          const level = heading[1].length;
          const textValue = heading[2];
          if (level === 1) {
            return (
              <h1 key={key} className="font-serif text-h3 leading-tight text-foreground">
                {textValue}
              </h1>
            );
          }
          if (level === 2) {
            return (
              <h2 key={key} className="font-serif text-h4 leading-tight text-foreground">
                {textValue}
              </h2>
            );
          }
          return (
            <h3 key={key} className="text-ui font-semibold text-foreground">
              {textValue}
            </h3>
          );
        }

        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
          return (
            <ul key={key} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={`${key}:li:${lineIndex}`}>{line.replace(/^\s*[-*]\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        if (block.startsWith("```") && block.endsWith("```")) {
          return (
            <pre
              key={key}
              className="overflow-x-auto rounded-md border border-border bg-surface p-3 font-mono text-label leading-6"
            >
              {block.replace(/^```\w*\n?/, "").replace(/```$/, "")}
            </pre>
          );
        }

        return (
          <p key={key} className="whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function FilesPanel({
  scope,
  channelId,
  videoId,
  files,
  dataConfigured,
  contextTitle,
  contextDetail,
  contextLabel,
  contextBody,
}: FilesPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const imageSplitRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const verticalResizeRef = useRef<{
    target: VerticalResizeTarget;
    startY: number;
    imageHeight: number;
    explorerHeight: number;
    contextHeight: number;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(files[0]?.id ?? null);
  const [preview, setPreview] = useState<PreviewState>({ status: "empty" });
  const [markdownMode, setMarkdownMode] = useState<MarkdownMode>("reader");
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [imageListWidthPct, setImageListWidthPct] = useState(38);
  const [listWidthPct, setListWidthPct] = useState(44);
  const [imageHeight, setImageHeight] = useState(360);
  const [explorerHeight, setExplorerHeight] = useState(460);
  const [contextHeight, setContextHeight] = useState(260);
  const [splitDragging, setSplitDragging] = useState(false);
  const [imageSplitDragging, setImageSplitDragging] = useState(false);
  const [verticalDragging, setVerticalDragging] = useState<VerticalResizeTarget | null>(null);
  const [dragging, setDragging] = useState(false);
  const [imageDragging, setImageDragging] = useState(false);
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => files.find((file) => file.id === selectedId) ?? files[0] ?? null,
    [files, selectedId],
  );

  const scopeKey =
    scope === "video" && videoId
      ? `video:${videoId}`
      : scope === "channel" && channelId
        ? `channel:${channelId}`
        : "workspace";
  const imageOrderStorageKey = `praxis:files:image-order:${scopeKey}`;

  const imageFiles = useMemo(() => files.filter(isImageFile), [files]);

  const orderedImageFiles = useMemo(() => {
    const byId = new Map(imageFiles.map((file) => [file.id, file]));
    const ordered = imageOrder
      .map((id) => byId.get(id))
      .filter((file): file is FileRow => Boolean(file));
    const seen = new Set(ordered.map((file) => file.id));
    return [...ordered, ...imageFiles.filter((file) => !seen.has(file.id))];
  }, [imageFiles, imageOrder]);

  useEffect(() => {
    if (!selectedId || !files.some((file) => file.id === selectedId)) {
      setSelectedId(files[0]?.id ?? null);
    }
  }, [files, selectedId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(imageOrderStorageKey);
      setImageOrder(saved ? JSON.parse(saved) : []);
    } catch {
      setImageOrder([]);
    }
  }, [imageOrderStorageKey]);

  useEffect(() => {
    const ids = new Set(imageFiles.map((file) => file.id));
    setImageOrder((prev) => {
      const kept = prev.filter((id) => ids.has(id));
      const missing = imageFiles.map((file) => file.id).filter((id) => !kept.includes(id));
      return [...kept, ...missing];
    });
  }, [imageFiles]);

  useEffect(() => {
    try {
      localStorage.setItem(imageOrderStorageKey, JSON.stringify(imageOrder));
    } catch {
      // Ignore localStorage quota/privacy errors.
    }
  }, [imageOrderStorageKey, imageOrder]);

  useEffect(() => {
    if (imageFiles.length === 0) {
      setImageUrls({});
      return;
    }

    setImageUrls(Object.fromEntries(imageFiles.map((file) => [file.id, `/api/files/${file.id}`])));
  }, [imageFiles]);

  useEffect(() => {
    setMarkdownMode("reader");
    setEditDraft("");
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) {
      setPreview({ status: "empty" });
      return;
    }

    let cancelled = false;
    setPreview({ status: "loading" });

    async function loadPreview() {
      const kind = previewKind(selected);
      if (kind === "text") {
        try {
          const response = await fetch(`/api/files/${selected.id}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Could not load this file.");
          const text = await response.text();
          if (!cancelled) {
            setPreview({ status: "text", text });
            setEditDraft(text);
          }
        } catch (error) {
          if (!cancelled) {
            setPreview({
              status: "error",
              message: error instanceof Error ? error.message : "Could not load this file.",
            });
          }
        }
        return;
      }

      if (!cancelled) {
        setPreview({ status: "object", url: `/api/files/${selected.id}`, kind });
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [selected]);

  useEffect(() => {
    if (!splitDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      const bounds = splitRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width <= 0) return;
      const pct = ((e.clientX - bounds.left) / bounds.width) * 100;
      setListWidthPct(Math.max(0, Math.min(100, pct)));
    };

    const onPointerUp = () => setSplitDragging(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [splitDragging]);

  useEffect(() => {
    if (!imageSplitDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      const bounds = imageSplitRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width <= 0) return;
      const pct = ((e.clientX - bounds.left) / bounds.width) * 100;
      setImageListWidthPct(Math.max(0, Math.min(100, pct)));
    };

    const onPointerUp = () => setImageSplitDragging(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [imageSplitDragging]);

  useEffect(() => {
    if (!verticalDragging) return;

    const minHeight = 96;
    const onPointerMove = (e: PointerEvent) => {
      const start = verticalResizeRef.current;
      if (!start) return;
      const delta = e.clientY - start.startY;

      if (start.target === "image-explorer") {
        const total = start.imageHeight + start.explorerHeight;
        const nextImage = Math.max(minHeight, Math.min(total - minHeight, start.imageHeight + delta));
        setImageHeight(nextImage);
        setExplorerHeight(total - nextImage);
        return;
      }

      const total = start.explorerHeight + start.contextHeight;
      const nextExplorer = Math.max(minHeight, Math.min(total - minHeight, start.explorerHeight + delta));
      setExplorerHeight(nextExplorer);
      setContextHeight(total - nextExplorer);
    };

    const onPointerUp = () => {
      setVerticalDragging(null);
      verticalResizeRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [verticalDragging]);

  if (!dataConfigured) {
    return (
      <p className="text-meta leading-6 text-muted">
        Configure <code className="rounded bg-black/5 px-1 dark:bg-white/10">DATABASE_URL</code> in{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code> to upload and preview files.
      </p>
    );
  }

  const title =
    scope === "workspace" ? "Workspace files" : scope === "video" ? "This video" : "Whole channel";

  async function uploadFiles(fileList: FileList | File[]) {
    const picked = Array.from(fileList);
    if (picked.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("scope", scope);
      if (channelId) fd.set("channel_id", channelId);
      if (scope === "video" && videoId) fd.set("video_id", videoId);
      for (const file of picked) fd.append("files", file);

      const result = await uploadFilesAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.refresh();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function uploadImageFiles(fileList: FileList | File[]) {
    const picked = Array.from(fileList).filter((file) => {
      const ext = extension(file.name);
      return file.type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
    });
    if (picked.length === 0) {
      setError("Drop image files only: png, jpg, jpeg, gif, or webp.");
      return;
    }
    await uploadFiles(picked);
  }

  async function onDelete(file: FileRow) {
    if (!confirm(`Delete ${file.name}?`)) return;

    setError(null);
    setDeletingId(file.id);
    try {
      const fd = new FormData();
      fd.set("id", file.id);
      fd.set("object_path", file.object_path);
      const result = await deleteFileRecord(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function saveMarkdownEdit() {
    if (!selected || !isMarkdownFile(selected)) return;

    setError(null);
    setSavingEdit(true);
    try {
      const fd = new FormData();
      fd.set("id", selected.id);
      fd.set("content", editDraft);
      fd.set("mime_type", selected.mime_type || "text/markdown");
      const result = await updateFileContent(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPreview({ status: "text", text: editDraft });
      setMarkdownMode("reader");
    } finally {
      setSavingEdit(false);
    }
  }

  function moveImageCard(targetId: string) {
    if (!draggedImageId || draggedImageId === targetId) return;
    setImageOrder((prev) => {
      const base = orderedImageFiles.map((file) => file.id);
      const current = prev.length > 0 ? [...prev.filter((id) => base.includes(id)), ...base.filter((id) => !prev.includes(id))] : base;
      const from = current.indexOf(draggedImageId);
      const to = current.indexOf(targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const showListPane = listWidthPct > 4;
  const showPreviewPane = listWidthPct < 96;
  const showImageListPane = imageListWidthPct > 4;
  const showImageCardsPane = imageListWidthPct < 96;
  const imageListStyle = showImageListPane
    ? { flexBasis: `${Math.max(14, Math.min(86, imageListWidthPct))}%` }
    : { flexBasis: 0 };
  const imageCardsStyle = showImageCardsPane ? { flexBasis: 0, flexGrow: 1 } : { flexBasis: 0 };
  const listStyle = showListPane
    ? { flexBasis: `${Math.max(14, Math.min(86, listWidthPct))}%` }
    : { flexBasis: 0 };
  const previewStyle = showPreviewPane ? { flexBasis: 0, flexGrow: 1 } : { flexBasis: 0 };

  function startVerticalResize(target: VerticalResizeTarget, y: number) {
    verticalResizeRef.current = {
      target,
      startY: y,
      imageHeight,
      explorerHeight,
      contextHeight,
    };
    setVerticalDragging(target);
  }

  return (
    <div className={`space-y-0 ${verticalDragging ? "cursor-row-resize select-none" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">Files</div>
          <p className="mt-0.5 text-label text-muted">{title}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-paper px-2.5 text-label font-medium text-foreground shadow-sm transition-colors hover:bg-black/4 disabled:opacity-60 dark:hover:bg-white/5"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Upload className="h-3.5 w-3.5" aria-hidden />}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
          }}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        className={`mt-4 rounded-md border border-dashed px-3 py-3 text-center text-meta transition-colors ${
          dragging
            ? "border-accent bg-accent/10 text-foreground"
            : "border-border bg-surface/60 text-muted"
        }`}
      >
        {uploading ? "Uploading files..." : "Drag and drop multiple files here, or use Upload."}
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <section
        className="mt-4 overflow-hidden rounded-md border border-border bg-paper dark:bg-paper-light/20"
        style={{ height: imageHeight }}
      >
        <div className="border-b border-border px-3 py-2">
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Image board
          </div>
          <p className="mt-0.5 text-label text-muted">
            Drop images on the left, then reorder cards on the right.
          </p>
        </div>
        <div
          ref={imageSplitRef}
          className={`flex h-[calc(100%-3.75rem)] min-h-0 overflow-hidden ${
            imageSplitDragging ? "cursor-col-resize select-none" : ""
          }`}
        >
          <div
            className={`min-h-0 overflow-y-auto border-r border-border bg-surface p-3 ${
              showImageListPane ? "min-w-[12rem]" : "min-w-0"
            }`}
            style={imageListStyle}
          >
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setImageDragging(true);
              }}
              onDragLeave={() => setImageDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImageDragging(false);
                void uploadImageFiles(e.dataTransfer.files);
              }}
              className={`block w-full rounded-md border border-dashed px-3 py-6 text-center text-meta transition-colors ${
                imageDragging
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border bg-paper text-muted hover:bg-black/4 dark:bg-paper-light/20 dark:hover:bg-white/5"
              }`}
            >
              {uploading ? "Uploading images..." : "Drop images here"}
              <span className="mt-1 block text-label text-muted">png, jpg, jpeg, gif, webp</span>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) void uploadImageFiles(e.target.files);
                if (imageInputRef.current) imageInputRef.current.value = "";
              }}
            />

            <div className="mt-3 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
              Image files
            </div>
            <div className="mt-2 max-h-56 overflow-y-auto">
              {orderedImageFiles.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-meta text-muted">
                  No images yet.
                </div>
              ) : (
                <ul className="space-y-1">
                  {orderedImageFiles.map((file, index) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(file.id)}
                        className={`flex w-full min-w-0 items-center gap-2 rounded-md border px-2 py-2 text-left ${
                          selected?.id === file.id
                            ? "border-accent bg-black/4 dark:bg-white/10"
                            : "border-transparent hover:border-border hover:bg-black/4 dark:hover:bg-white/5"
                        }`}
                      >
                        <span className="w-5 shrink-0 text-center font-mono text-label text-muted">
                          {index + 1}
                        </span>
                        <ImageIcon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                        <span className="min-w-0">
                          <span className="block truncate text-meta font-medium text-foreground">
                            {file.name}
                          </span>
                          <span className="block text-label text-muted">{formatBytes(file.size_bytes)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setImageSplitDragging(true);
            }}
            className="flex w-3 shrink-0 cursor-col-resize items-center justify-center border-r border-border bg-paper text-muted hover:bg-black/4 hover:text-foreground dark:bg-paper-light/20 dark:hover:bg-white/5"
            aria-label="Resize image file list and image cards"
            title="Drag to resize image file list and image cards"
          >
            <GripVertical className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>

          <div
            className={`min-h-0 overflow-x-auto p-3 ${showImageCardsPane ? "min-w-[12rem]" : "min-w-0"}`}
            style={imageCardsStyle}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => setDraggedImageId(null)}
          >
            {orderedImageFiles.length === 0 ? (
              <div className="flex h-full min-h-[15rem] items-center justify-center rounded-md border border-dashed border-border px-4 text-center text-meta text-muted">
                Image cards will appear here after upload.
              </div>
            ) : (
              <div className="flex min-w-max gap-3">
                {orderedImageFiles.map((file, index) => (
                  <article
                    key={file.id}
                    draggable
                    onDragStart={() => setDraggedImageId(file.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      moveImageCard(file.id);
                      setDraggedImageId(null);
                    }}
                    onDragEnd={() => setDraggedImageId(null)}
                    className={`w-52 shrink-0 cursor-grab overflow-hidden rounded-md border bg-surface shadow-sm active:cursor-grabbing ${
                      draggedImageId === file.id ? "border-accent opacity-60" : "border-border"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(file.id)}
                      className="block w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border px-2 py-1.5">
                        <span className="font-mono text-label text-muted">#{index + 1}</span>
                        <span className="truncate text-label font-medium text-foreground">{file.name}</span>
                      </div>
                      <div className="flex h-40 items-center justify-center bg-paper dark:bg-paper-light/20">
                        {imageUrls[file.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrls[file.id]}
                            alt={file.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted" aria-hidden />
                        )}
                      </div>
                      <div className="border-t border-border px-2 py-1.5 text-label text-muted">
                        {formatBytes(file.size_bytes)}
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          startVerticalResize("image-explorer", e.clientY);
        }}
        className="my-3 flex h-3 w-full cursor-row-resize items-center justify-center border-y border-border bg-paper text-muted hover:bg-black/4 hover:text-foreground dark:bg-paper-light/20 dark:hover:bg-white/5"
        aria-label="Resize Image board and File explorer"
        title="Drag to resize Image board and File explorer"
      >
        <GripHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>

      <div
        ref={splitRef}
        className={`flex overflow-hidden rounded-md border border-border bg-paper dark:bg-paper-light/20 ${
          splitDragging ? "cursor-col-resize select-none" : ""
        }`}
        style={{ height: explorerHeight }}
      >
        <div
          className={`min-h-0 overflow-hidden bg-surface ${showListPane ? "min-w-[11rem]" : "min-w-0"}`}
          style={listStyle}
        >
          <div className="border-b border-border px-3 py-2 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            File explorer
          </div>
          <div className="h-[calc(100%-2.25rem)] overflow-y-auto p-2">
            {files.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-3 py-5 text-center text-meta text-muted">
                No files yet.
              </div>
            ) : (
              <ul className="space-y-1">
                {files.map((file) => {
                  const active = selected?.id === file.id;
                  const kind = previewKind(file);
                  return (
                    <li key={file.id}>
                      <div
                        className={`flex items-stretch overflow-hidden rounded-md border ${
                          active
                            ? "border-accent bg-black/4 dark:bg-white/10"
                            : "border-transparent hover:border-border hover:bg-black/4 dark:hover:bg-white/5"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedId(file.id)}
                          className="flex min-w-0 flex-1 items-start gap-2 px-2 py-2 text-left"
                        >
                          {kind === "image" ? (
                            <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                          ) : (
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-meta font-medium text-foreground">
                              {file.name}
                            </span>
                            <span className="block text-label text-muted">
                              {extension(file.name).toUpperCase() || "FILE"} · {formatBytes(file.size_bytes)}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(file)}
                          disabled={deletingId !== null}
                          className="flex shrink-0 items-center justify-center border-l border-border/60 px-2 text-muted hover:bg-red-500/10 hover:text-red-800 disabled:opacity-50 dark:hover:text-red-300"
                          aria-label="Delete file"
                          title="Delete file"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            setSplitDragging(true);
          }}
          className="flex w-3 shrink-0 cursor-col-resize items-center justify-center border-x border-border bg-paper text-muted hover:bg-black/4 hover:text-foreground dark:bg-paper-light/20 dark:hover:bg-white/5"
          aria-label="Resize files panels"
          title="Drag to resize files panels"
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </button>

        <div
          className={`min-h-0 overflow-hidden bg-paper dark:bg-paper-light/20 ${
            showPreviewPane ? "min-w-[12rem]" : "min-w-0"
          }`}
          style={previewStyle}
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
            <div className="min-w-0">
              <div className="truncate text-meta font-medium text-foreground">
                {selected?.name ?? "Preview"}
              </div>
              {selected ? (
                <div className="text-label text-muted">{selected.mime_type || "Unknown type"}</div>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {selected && isMarkdownFile(selected) && preview.status === "text" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMarkdownMode("reader")}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-border ${
                      markdownMode === "reader"
                        ? "bg-black/6 text-foreground dark:bg-white/10"
                        : "text-muted hover:bg-black/4 hover:text-foreground dark:hover:bg-white/5"
                    }`}
                    aria-label="Reader mode"
                    title="Reader mode"
                  >
                    <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMarkdownMode("edit")}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-border ${
                      markdownMode === "edit"
                        ? "bg-black/6 text-foreground dark:bg-white/10"
                        : "text-muted hover:bg-black/4 hover:text-foreground dark:hover:bg-white/5"
                    }`}
                    aria-label="Edit mode"
                    title="Edit mode"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  {markdownMode === "edit" ? (
                    <button
                      type="button"
                      onClick={() => void saveMarkdownEdit()}
                      disabled={savingEdit}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-label font-medium text-foreground hover:bg-black/4 disabled:opacity-60 dark:hover:bg-white/5"
                    >
                      {savingEdit ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Save className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Save
                    </button>
                  ) : null}
                </>
              ) : null}
              {preview.status === "object" ? (
              <a
                href={preview.url}
                download={selected?.name}
                className="shrink-0 rounded-md border border-border px-2 py-1 text-label text-foreground hover:bg-black/4 dark:hover:bg-white/5"
              >
                Download
              </a>
              ) : null}
            </div>
          </div>
          <div className="h-[calc(100%-3.5rem)] overflow-auto">
            {preview.status === "empty" ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-meta text-muted">
                Select a file to preview it.
              </div>
            ) : preview.status === "loading" ? (
              <div className="flex h-full items-center justify-center gap-2 text-meta text-muted">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading preview...
              </div>
            ) : preview.status === "error" ? (
              <div className="p-4 text-meta text-red-700 dark:text-red-300">{preview.message}</div>
            ) : preview.status === "text" ? (
              selected && isMarkdownFile(selected) && markdownMode === "reader" ? (
                <MarkdownReader text={preview.text} />
              ) : selected && isMarkdownFile(selected) && markdownMode === "edit" ? (
                <textarea
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  spellCheck={false}
                  className="h-full min-h-[28rem] w-full resize-none border-0 bg-paper p-4 font-mono text-label leading-6 text-foreground outline-none dark:bg-paper-light/20"
                  aria-label="Markdown editor"
                />
              ) : (
                <pre className="whitespace-pre-wrap break-words p-4 font-mono text-label leading-6 text-foreground">
                  {preview.text}
                </pre>
              )
            ) : preview.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt={selected?.name ?? "Selected file"} className="h-auto w-full" />
            ) : preview.kind === "pdf" ? (
              <iframe title={selected?.name ?? "PDF preview"} src={preview.url} className="h-full w-full" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-meta text-muted">
                <p>Preview is not available for this file type.</p>
                <a
                  href={preview.url}
                  download={selected?.name}
                  className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-black/4 dark:hover:bg-white/5"
                >
                  Download file
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          startVerticalResize("explorer-context", e.clientY);
        }}
        className="my-3 flex h-3 w-full cursor-row-resize items-center justify-center border-y border-border bg-paper text-muted hover:bg-black/4 hover:text-foreground dark:bg-paper-light/20 dark:hover:bg-white/5"
        aria-label="Resize File explorer and Context"
        title="Drag to resize File explorer and Context"
      >
        <GripHorizontal className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </button>

      <section
        className="overflow-y-auto rounded-md border border-border bg-surface p-4 shadow-soft"
        style={{ height: contextHeight }}
      >
        <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
          Context
        </div>
        <div className="mt-3 font-serif text-h4 text-foreground">{contextLabel}</div>
        <p className="mt-3 text-body leading-7 text-muted">{contextBody}</p>
        <div className="mt-5 space-y-3">
          <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
            <div className="text-label text-muted">Current</div>
            <div className="mt-1 text-ui font-medium text-foreground">{contextTitle}</div>
          </div>
          <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
            <div className="text-label text-muted">Focus</div>
            <div className="mt-1 text-ui font-medium text-foreground">{contextDetail}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
