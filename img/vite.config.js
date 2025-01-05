import { defineConfig } from 'vite';
import ghPages from 'vite-plugin-gh-pages';

export default defineConfig({
  base: '/L.A.N.M-3D/', // Replace <repository-name> with your GitHub repository name
  plugins: [ghPages()],
});