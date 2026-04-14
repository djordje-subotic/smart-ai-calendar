import { getGoogleAuthUrl } from "@/src/actions/google-calendar";

export async function GET() {
  try {
    const url = await getGoogleAuthUrl();
    return Response.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message, url: null }, { status: 500 });
  }
}
