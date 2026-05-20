import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export default function (eleventyConfig) {
  // Static asset passthroughs.
  eleventyConfig.addPassthroughCopy({ 'src/styles': 'styles' });
  eleventyConfig.addPassthroughCopy({ public: '/' });
  // Client bundles produced by build.mjs (esbuild) live in build-tmp/public.
  eleventyConfig.addPassthroughCopy({ 'build-tmp/public': '/' });

  return {
    dir: {
      input: 'src',
      output: '_site',
      includes: '_includes',
      data: '_data',
    },
    templateFormats: ['11ty.js'],
    htmlTemplateEngine: false,
    markdownTemplateEngine: false,
    pathPrefix: '/',
  };
}
