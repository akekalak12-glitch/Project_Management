export const runtime = 'edge';
export async function GET() {
  return new Response("Hello Cloudflare Workers Edge!", {
    status: 200,
    headers: { "content-type": "text/plain" }
  });
}
