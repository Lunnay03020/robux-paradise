export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/access/")) {
      const accessHtml = await env.ASSETS.fetch("https://robux-paradise.com/access.html");
      return new Response(accessHtml.body, {
        status: 200,
        headers: {
          "content-type": "text/html"
        }
      });
    }
    return env.ASSETS.fetch(request);
  }
}