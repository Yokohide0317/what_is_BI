import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import a11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  { ignores: ['dist/**', '.astro/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['**/*.tsx'], plugins: { 'jsx-a11y': a11y }, rules: a11y.configs.recommended.rules },
);
