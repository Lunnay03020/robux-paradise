const PAGES_URL = 'https://robux-paradise.com';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Route dynamique vers access.html
    if (url.pathname.startsWith('/access/')) {
      return fetch(`${PAGES_URL}/access.html`, request);
    }

    // Tout le reste : sert depuis ton site Pages
    return fetch(`${PAGES_URL}${url.pathname}`, request);
  }
}