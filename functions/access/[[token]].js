export async function onRequest(context) {
  const url = new URL(context.request.url);
  const assetRequest = new Request(url.origin + '/access.html', context.request);
  return await context.env.ASSETS.fetch(assetRequest);
}