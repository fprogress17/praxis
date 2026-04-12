"use client";

import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "praxis:rightPanelWidthPx";
const DEFAULT = 300;
/** Must match `PanelResizeHandle` width (`w-3` = 12px). */
const HANDLE_WIDTH_PX = 12;

function clampToSplit(w: number, maxR: number) {
  const cap = Math.max(0, maxR);
  return Math.min(cap, Math.max(0, w));
}

/**
 * Right panel width only (not including the handle). Range is 0 … (split width − handle):
 * - 0 → center uses all space (center “full”)
 * - max → center collapses, right uses the rest (right “full” beside sidebar)
 */
export function useRightPanelWidth(
  splitRegionRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
) {
  const [width, setWidth] = useState(DEFAULT);
  const [dragging, setDragging] = useState(false);
  const grabOffsetRef = useRef(0);
  const widthRef = useRef(DEFAULT);
  widthRef.current = width;
  const didHydrateRef = useRef(false);

  useEffect(() => {
    const el = splitRegionRef.current;
    if (!el) return;

    const apply = () => {
      const maxR = Math.max(0, el.getBoundingClientRect().width - HANDLE_WIDTH_PX);

      if (!didHydrateRef.current) {
        didHydrateRef.current = true;
        try {
          const s = localStorage.getItem(STORAGE_KEY);
          if (s) {
            const w = parseInt(s, 10);
            if (!Number.isNaN(w)) {
              const next = clampToSplit(w, maxR);
              widthRef.current = next;
              setWidth(next);
              return;
            }
          }
        } catch {
          /* ignore */
        }
        const next = clampToSplit(DEFAULT, maxR);
        widthRef.current = next;
        setWidth(next);
        return;
      }

      setWidth((prev) => {
        const next = clampToSplit(prev, maxR);
        widthRef.current = next;
        return next;
      });
    };

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    apply();
    return () => ro.disconnect();
  }, [splitRegionRef]);

  useEffect(() => {
    if (!dragging) return;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (e: MouseEvent) => {
      const splitEl = splitRegionRef.current;
      if (!splitEl) return;
      const splitRect = splitEl.getBoundingClientRect();
      const maxR = Math.max(0, splitRect.width - HANDLE_WIDTH_PX);
      const targetHandleLeft = e.clientX - grabOffsetRef.current;
      const w = splitRect.right - targetHandleLeft - HANDLE_WIDTH_PX;
      const next = clampToSplit(w, maxR);
      widthRef.current = next;
      setWidth(next);
    };

    const onUp = () => {
      setDragging(false);
      try {
        localStorage.setItem(STORAGE_KEY, String(widthRef.current));
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [dragging, splitRegionRef]);

  function onResizePointerDown(e: React.MouseEvent) {
    e.preventDefault();
    const handleEl = handleRef.current;
    const splitEl = splitRegionRef.current;
    if (!handleEl || !splitEl) return;
    const handleLeft = handleEl.getBoundingClientRect().left;
    grabOffsetRef.current = e.clientX - handleLeft;
    setDragging(true);
  }

  return { widthPx: width, dragging, onResizePointerDown };
}
