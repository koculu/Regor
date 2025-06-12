import js from '@eslint/js';
import plugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  ...plugin.configs['flat/recommended'].map(c => ({
    ...c,
    languageOptions: {
      ...(c.languageOptions || {}),
      parser,
      globals: {
        document: 'readonly',
        window: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        Node: 'readonly',
        EventTarget: 'readonly',
        Event: 'readonly',
        ChildNode: 'readonly',
      },
    },
  }))
];
