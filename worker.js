const PAGES_URL = 'https://robux-paradise-aq2.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/access/')) {
      return fetch(`${PAGES_URL}/access.html`, request);
    }
    return fetch(`${PAGES_URL}${url.pathname}`, request);
  }
}