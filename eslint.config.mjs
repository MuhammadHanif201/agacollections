import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The storefront keeps the original <img> markup so the rendered layout is unchanged
      '@next/next/no-img-element': 'off',
      // Original stylesheets are linked in a fixed order from the layout and pages
      '@next/next/no-css-tags': 'off',
      '@next/next/no-page-custom-font': 'off',
      // The storefront keeps the Laravel site's full page loads (plain <a> links and
      // location changes), so the header, bag count and sign-in state are always fresh
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-location-assign-relative-destination': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'public/**', 'next-env.d.ts'] },
];

export default config;
