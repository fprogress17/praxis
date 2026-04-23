"use server";

import { revalidatePath } from "next/cache";
import {
  createChannelRecord,
  parseChannelFormData,
  type CreateChannelResult,
  updateChannelOrder,
} from "@/lib/server/channels";

export async function createChannel(formData: FormData): Promise<CreateChannelResult> {
  const result = await createChannelRecord(parseChannelFormData(formData));
  if (!result.ok) {
    return result;
  }

  revalidatePath("/");
  return result;
}

export async function updateChannelPositions(orderedIds: string[]): Promise<void> {
  await updateChannelOrder(orderedIds);
}
