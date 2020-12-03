module.exports = {
  extends: [require.resolve('@umijs/fabric/dist/eslint')],
  globals: {
    page: true,
    REACT_APP_ENV: true,
  },
  rules: {
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
  },
};
