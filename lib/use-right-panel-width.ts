"use client";

import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "praxis:rightPanelWidthPx";
const DEFAULT = 300;
const MIN = 220;
const MAX = 560;

function clamp(n: number) {
  return Math.min(MAX, Math.max(MIN, n));
}

export function useRightPanelWidth() {
  const [width, setWidth] = useState(DEFAULT);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
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
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const next = clamp(dragRef.current.startWidth + dx);
      widthRef.current = next;
      setWidth(next);
    };

    const onUp = () => {
      dragRef.current = null;
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
  }, [dragging]);

  function onResizePointerDown(e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: widthRef.current };
    setDragging(true);
  }

  return { widthPx: width, dragging, onResizePointerDown };
}
