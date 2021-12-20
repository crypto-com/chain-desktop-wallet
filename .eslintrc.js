module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  globals: {
    page: true,
    REACT_APP_ENV: true,
  },
  plugins: ['react-hooks'],
  settings: {
    'import/core-modules': ["electron"],
  },
  rules: {
    '@typescript-eslint/object-curly-spacing': 'off',
    'jsx-a11y/accessible-emoji': 'off',
    'no-new-wrappers': 'off',
    'no-extra-boolean-cast': 'off',
    'react/no-array-index-key': 'off',
    'no-plusplus': 'off',
    'react/prefer-stateless-function': 'off',
    'no-param-reassign': 'off', // used redux-immer for simplification
    'prefer-object-spread': 'off',
    'max-classes-per-file': ['error', 3],
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/method-signature-style': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/type-annotation-spacing': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/parser': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.spec.ts'] }],
    'react-hooks/rules-of-hooks': 'error',
    'import/no-unresolved': 'off',
    'no-return-await': 'off',
    'react-hooks/exhaustive-deps': [
      'off',
      {
        additionalHooks: 'useRecoilCallback',
      },
    ],
  },
};
