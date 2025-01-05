import { defineConfig } from 'vite';
import ghPages from 'vite-plugin-gh-pages';

export default defineConfig({
  base: '/<repository-name>/', // Replace <repository-name> with your GitHub repository name
  plugins: [ghPages()],
});