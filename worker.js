export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/access/')) {
      const assetRequest = new Request(`${url.origin}/access.html`, request);
      return await env.ASSETS.fetch(assetRequest);
    }
    return env.ASSETS.fetch(request);
  }
}