"use client";

import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "praxis:rightPanelWidthPx";
const DEFAULT = 300;
const MIN = 220;
const MAX = 560;
/** Must match `PanelResizeHandle` width (`w-3` = 12px). */
const HANDLE_WIDTH_PX = 12;

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, n));
}

/**
 * Width from the flex row’s geometry so the splitter tracks the pointer:
 * rightPanelWidth = row.right − handleLeft − handleWidth.
 */
export function useRightPanelWidth(
  flexRowRef: RefObject<HTMLElement | null>,
  handleRef: RefObject<HTMLElement | null>,
) {
  const [width, setWidth] = useState(DEFAULT);
  const [dragging, setDragging] = useState(false);
  const grabOffsetRef = useRef(0);
  const widthRef = useRef(DEFAULT);
  widthRef.current = width;

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const w = parseInt(s, 10);
        if (!Number.isNaN(w)) {
          setWidth(clamp(w));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (e: MouseEvent) => {
      const rowEl = flexRowRef.current;
      if (!rowEl) return;
      const rowRect = rowEl.getBoundingClientRect();
      const targetHandleLeft = e.clientX - grabOffsetRef.current;
      const w = rowRect.right - targetHandleLeft - HANDLE_WIDTH_PX;
      const next = clamp(w);
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
  }, [dragging, flexRowRef]);

  function onResizePointerDown(e: React.MouseEvent) {
    e.preventDefault();
    const handleEl = handleRef.current;
    const rowEl = flexRowRef.current;
    if (!handleEl || !rowEl) return;
    const handleLeft = handleEl.getBoundingClientRect().left;
    grabOffsetRef.current = e.clientX - handleLeft;
    setDragging(true);
  }

  return { widthPx: width, dragging, onResizePointerDown };
}
