/** @typedef {{ AUTH_URL: string, GRAPHQL_URL: string, STORAGE_KEY: string }} AppConfig */

/** @type {AppConfig} */
export const CONFIG = {
  AUTH_URL: 'https://01.tomorrow-school.ai/api/auth/signin',
  GRAPHQL_URL: 'https://01.tomorrow-school.ai/api/graphql-engine/v1/graphql',
  STORAGE_KEY: 'profile_jwt_v1',
};
