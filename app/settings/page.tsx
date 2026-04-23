import { SettingsClient } from "@/app/settings/settings-client";
import { getDesktopLanStatus } from "@/lib/server/desktop-settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const status = await getDesktopLanStatus();
  return <SettingsClient initialStatus={status} />;
}
