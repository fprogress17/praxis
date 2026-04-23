import { revalidatePath } from "next/cache";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { dispatchApiRequest } from "@/lib/server/http-api";

type NextApiOptions = {
  pathname: string;
  revalidate?: boolean;
};

export async function handleNextApiRequest(request: Request, options: NextApiOptions) {
  const proxied = await proxyApiRequest(request, options.pathname);
  if (proxied) return proxied;

  const response = await dispatchApiRequest(request, options.pathname);
  if (!response) {
    return Response.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  if (options.revalidate && response.ok) {
    revalidatePath("/");
  }

  return response;
}
