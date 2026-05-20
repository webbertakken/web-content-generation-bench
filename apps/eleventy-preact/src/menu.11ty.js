// ESM JS-template that emits one HTML page per restaurant.
//
// The TSX components are pre-bundled by build.mjs (esbuild) into
// build-tmp/server.js (ESM). We import them here so Eleventy never has to
// understand TSX itself.
import { renderRestaurantHtml, loadDataset } from '../build-tmp/server.js';

export const data = () => {
  const dataset = loadDataset();
  return {
    pagination: {
      data: 'restaurants',
      size: 1,
      alias: 'restaurant',
    },
    restaurants: dataset.restaurants,
    permalink({ restaurant }) {
      return `/${restaurant.slug}/index.html`;
    },
    eleventyComputed: {
      title: ({ restaurant }) => restaurant.name,
    },
  };
};

export const render = ({ restaurant }) => renderRestaurantHtml(restaurant);
