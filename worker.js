export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/access/")) {
      const newRequest = new Request("https://robux-paradise.com/access.html", request);
      return await fetch(newRequest);
    }
    return await fetch(request);
  }
}