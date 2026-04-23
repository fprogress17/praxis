import { PraxisShell } from "@/components/praxis-shell";
import { serverApiBaseUrl, serverApiUrl } from "@/lib/api/url";
import { dbConfigured } from "@/lib/server/db";
import {
  getWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/server/workspace-snapshot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const apiBaseUrl = serverApiBaseUrl();
  const dataConfigured = Boolean(apiBaseUrl) || dbConfigured();
  let channels: WorkspaceSnapshot["channels"] = [];
  let videos: WorkspaceSnapshot["videos"] = [];
  let notes: WorkspaceSnapshot["notes"] = [];
  let files: WorkspaceSnapshot["files"] = [];
  let links: WorkspaceSnapshot["links"] = [];
  let ideas: WorkspaceSnapshot["ideas"] = [];
  let workspaceIdeas: WorkspaceSnapshot["workspaceIdeas"] = [];
  let workspaceNotes: WorkspaceSnapshot["workspaceNotes"] = [];

  if (dataConfigured) {
    try {
      if (apiBaseUrl) {
        const response = await fetch(serverApiUrl("/api/bootstrap"), { cache: "no-store" });
        const result = (await response.json()) as
          | ({ ok: true } & WorkspaceSnapshot)
          | { ok: false };
        if (!response.ok || !result.ok) {
          throw new Error("Could not load bootstrap snapshot.");
        }
        ({
          channels,
          videos,
          notes,
          files,
          links,
          ideas,
          workspaceIdeas,
          workspaceNotes,
        } = result);
      } else {
        ({
          channels,
          videos,
          notes,
          files,
          links,
          ideas,
          workspaceIdeas,
          workspaceNotes,
        } = await getWorkspaceSnapshot());
      }
    } catch {
      channels = [];
      videos = [];
      notes = [];
      files = [];
      links = [];
      ideas = [];
      workspaceIdeas = [];
      workspaceNotes = [];
    }
  }

  return (
    <PraxisShell
      initialChannels={channels}
      initialVideos={videos}
      initialNotes={notes}
      initialFiles={files}
      initialLinks={links}
      initialIdeas={ideas}
      initialWorkspaceIdeas={workspaceIdeas}
      initialWorkspaceNotes={workspaceNotes}
      dataConfigured={dataConfigured}
    />
  );
}
