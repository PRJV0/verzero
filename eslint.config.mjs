import next from "eslint-config-next";

const eslintConfig = [
  ...next,
  { ignores: ["docs/**", ".next/**", "node_modules/**"] },
];

export default eslintConfig;
