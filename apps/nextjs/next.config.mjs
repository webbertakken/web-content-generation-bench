/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable Next's image optimisation; we ship plain assets in /public.
  images: { unoptimized: true },
  // Pie web components ship raw TS; our workspace packages also ship TS.
  // Next must transpile both, otherwise Turbopack chokes on .ts imports.
  transpilePackages: [
    '@bench/data',
    '@bench/cart-core',
    '@justeattakeaway/pie-modal',
    '@justeattakeaway/pie-button',
    '@justeattakeaway/pie-card-container',
    '@justeattakeaway/pie-radio',
    '@justeattakeaway/pie-radio-group',
    '@justeattakeaway/pie-webc-core',
    '@justeattakeaway/pie-icons-webc',
    '@justeattakeaway/pie-icon-button',
    '@justeattakeaway/pie-spinner',
  ],
};

export default nextConfig;
