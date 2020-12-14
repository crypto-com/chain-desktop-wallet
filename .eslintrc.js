module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  globals: {
    page: true,
    REACT_APP_ENV: true,
  },
  plugins: [
    'react-hooks'
  ],
  rules: {
    "@typescript-eslint/type-annotation-spacing": "off",
    "@typescript-eslint/triple-slash-reference": "off",
    "@typescript-eslint/consistent-indexed-object-style":"off",
    "@typescript-eslint/semi":"off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/consistent-type-imports": "off",
    "@typescript-eslint/consistent-type-definitions": "off",
    "@typescript-eslint/method-signature-style":"off",
    "@typescript-eslint/array-type":'off',
    'jsx-a11y/accessible-emoji': 'off',
    'no-new-wrappers': 'off',
    'no-extra-boolean-cast': 'off',
    'react/no-array-index-key': 'off',
    'no-plusplus': 'off',
    'react/prefer-stateless-function': 'off',
    'no-param-reassign': 'off', // used redux-immer for simplification
    'prefer-object-spread': 'off',
    'max-classes-per-file': ['error', 3],
    'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/*.spec.ts'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': [
      'warn', {
        'additionalHooks': 'useRecoilCallback'
      }
    ]
  },
};
