import { proxyToBullBoard } from "@/lib/bff/proxy";

export async function GET(
  _req: Request,
   props : { params:  Promise<{ seriesId: string }> }
) {
  const { seriesId } = await props.params;
  return proxyToBullBoard(`/admin/api/series/${seriesId}`);
}

export async function PATCH(
  req: Request,
  { params }: { params: { seriesId: string } }
) {
  const bodyText = await req.text();
  return proxyToBullBoard(`/admin/api/series/${params.seriesId}`, {
    method: "PATCH",
    bodyText,
    contentType: "application/json",
  });
}
