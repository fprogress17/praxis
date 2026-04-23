"use client";

import Link from "next/link";
import { CirclePlus, GripVertical, Lightbulb } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChannelCard } from "@/components/channels/channel-card";
import { WorkspaceIdeaSidebarList } from "@/components/ideas/workspace-idea-sidebar-list";
import type { ChannelRow } from "@/lib/types/channel";
import type { WorkspaceIdeaRow } from "@/lib/types/workspace-idea";
import { ThemeToggle } from "@/components/theme-toggle";
import { Settings2 } from "lucide-react";

export function Sidebar({
  channels,
  onNewChannel,
  onWorkspaceIdea,
  workspaceIdeas,
  onGoHome,
  selectedId,
  onSelectChannel,
  onAddVideo,
  onAddIdea,
  onReorderChannels,
  dataConfigured,
}: {
  channels: ChannelRow[];
  onNewChannel: () => void;
  onWorkspaceIdea: () => void;
  workspaceIdeas: WorkspaceIdeaRow[];
  onGoHome: () => void;
  selectedId: string | null;
  onSelectChannel: (id: string) => void;
  onAddVideo: (channelId: string) => void;
  onAddIdea: (channelId: string) => void;
  onReorderChannels: (newIds: string[]) => void;
  dataConfigured: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = channels.findIndex((c) => c.id === active.id);
    const newIndex = channels.findIndex((c) => c.id === over.id);
    onReorderChannels(arrayMove(channels, oldIndex, newIndex).map((c) => c.id));
  }

  return (
    <aside className="hidden w-[260px] shrink-0 border-r border-border bg-paper lg:flex lg:flex-col">
      <div className="border-b border-border px-4 py-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onGoHome}
            className="block w-full rounded-md text-left outline-none ring-offset-2 ring-offset-paper transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent dark:ring-offset-paper"
          >
            <div className="font-serif text-h4 text-foreground">Praxis</div>
            <div className="text-body text-muted">YouTube channel creation workspace</div>
          </button>
          <Link
            href="/settings"
            aria-label="Open settings"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface p-2 text-muted shadow-soft transition-colors hover:bg-black/4 hover:text-foreground dark:hover:bg-white/5"
          >
            <Settings2 className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={onNewChannel}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-2.5 text-label font-medium text-foreground shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5"
          >
            <CirclePlus className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="truncate">New channel</span>
          </button>
          <button
            type="button"
            onClick={onWorkspaceIdea}
            disabled={!dataConfigured}
            title={!dataConfigured ? "Configure DATABASE_URL in .env.local first" : undefined}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-2 py-2.5 text-label font-medium text-foreground shadow-soft transition-colors hover:bg-black/4 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5"
          >
            <Lightbulb className="h-4 w-4 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
            Idea
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-3 px-2 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
          Channels
        </div>
        {channels.length === 0 ? (
          <p className="px-2 text-meta leading-6 text-muted">
            No channels yet. Create one to get started.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={channels.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {channels.map((ch) => (
                  <SortableChannelCard
                    key={ch.id}
                    channel={ch}
                    selectedId={selectedId}
                    onSelectChannel={onSelectChannel}
                    onAddVideo={onAddVideo}
                    onAddIdea={onAddIdea}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {dataConfigured ? <WorkspaceIdeaSidebarList ideas={workspaceIdeas} /> : null}
      </div>

      <div className="border-t border-border p-4">
        <ThemeToggle />
      </div>
    </aside>
  );
}

function SortableChannelCard({
  channel,
  selectedId,
  onSelectChannel,
  onAddVideo,
  onAddIdea,
}: {
  channel: ChannelRow;
  selectedId: string | null;
  onSelectChannel: (id: string) => void;
  onAddVideo: (id: string) => void;
  onAddIdea: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative ${isDragging ? "z-50 opacity-50" : ""}`}
    >
      {/* Drag handle — absolutely positioned top-right, above card content */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        tabIndex={-1}
        aria-label="Drag to reorder"
        className="absolute right-2 top-2.5 z-10 touch-none p-1 text-muted/30 transition-colors hover:text-muted cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <ChannelCard
        channel={channel}
        active={channel.id === selectedId}
        onSelect={onSelectChannel}
        onAddVideo={onAddVideo}
        onAddIdea={onAddIdea}
      />
    </div>
  );
}
