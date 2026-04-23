import { PraxisShell } from "@/components/praxis-shell";
import { dbConfigured } from "@/lib/server/db";
import {
  getWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from "@/lib/server/workspace-snapshot";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dataConfigured = dbConfigured();
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
