import { resolve } from 'path';
import { buildPackage } from './rollup.common';
import { createConfig } from './vite.config';

export default createConfig({
  entry: resolve(__dirname, 'src/package/entry-production.ts'),
  rollupOptions: buildPackage({
    name: 'web',
    env: 'production',
  }),
});
