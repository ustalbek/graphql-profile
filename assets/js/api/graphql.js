import { CONFIG } from '../config.js';

export async function graphqlRequest(jwt, query, variables) {
  const res = await fetch(CONFIG.GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ query, variables: variables ?? null }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `GraphQL HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  return json.data;
}

export const QUERY_USER_NORMAL = `
  query UserNormal {
    user {
      id
      login
    }
  }
`;

export const QUERY_OBJECT_BY_ID = `
  query ObjectById($id: Int!) {
    object(where: { id: { _eq: $id } }) {
      id
      name
      type
    }
  }
`;

export const QUERY_RESULTS_NESTED = `
  query ResultsNested($userId: Int!) {
    result(where: { userId: { _eq: $userId } }) {
      id
      grade
      user {
        id
        login
      }
      object {
        id
        name
        type
      }
    }
  }
`;

export const QUERY_XP_TRANSACTIONS = `
  query XpTransactions($userId: Int!) {
    transaction(
      where: { _and: [{ type: { _eq: "xp" } }, { userId: { _eq: $userId } }] }
      order_by: { createdAt: asc }
    ) {
      id
      amount
      createdAt
    }
  }
`;

export const QUERY_XP_AGGREGATE = `
  query XpSum($userId: Int!) {
    transaction_aggregate(
      where: { _and: [{ type: { _eq: "xp" } }, { userId: { _eq: $userId } }] }
    ) {
      aggregate {
        sum {
          amount
        }
      }
    }
  }
`;

export const QUERY_PROGRESS = `
  query ProgressForUser($userId: Int!) {
    progress(where: { userId: { _eq: $userId } }, limit: 5) {
      id
      objectId
      updatedAt
    }
  }
`;
