// Tell SvelteKit this app is pure SSG (no runtime).
export const prerender = true;
// We hydrate the cart island on the client; the static parts stay static.
export const ssr = true;
// No need for the SvelteKit client router; each page is independent.
export const csr = true;
export const trailingSlash = 'always';
