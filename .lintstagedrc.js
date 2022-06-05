module.exports = {
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
  '*.{js,jsx,ts,tsx}': 'eslint --fix',
  '*.{html,js,json,jsx,ts,tsx,css,md,yaml}': 'prettier --write',
};
