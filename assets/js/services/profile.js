import { getUserIdFromJwt } from '../api/auth.js';
import {
  graphqlRequest,
  QUERY_USER_NORMAL,
  QUERY_OBJECT_BY_ID,
  QUERY_RESULTS_NESTED,
  QUERY_XP_TRANSACTIONS,
  QUERY_XP_AGGREGATE,
  QUERY_PROGRESS,
} from '../api/graphql.js';

function coerceUserId(raw) {
  if (raw === null || raw === undefined) return null;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : null;
}

function matchUserRow(users, jwtId) {
  if (!users?.length) return null;
  if (jwtId != null && jwtId !== '') {
    const idStr = String(jwtId);
    const byStr = users.find((u) => String(u.id) === idStr);
    if (byStr) return byStr;
    const n = Number(jwtId);
    if (Number.isFinite(n)) {
      const byNum = users.find((u) => Number(u.id) === n);
      if (byNum) return byNum;
    }
  }
  if (users.length === 1) return users[0];
  return null;
}

function transactionAmount(row) {
  if (row.amount != null) return Number(row.amount) || 0;
  if (row.value != null) return Number(row.value) || 0;
  return 0;
}

async function fetchXpTransactions(jwt, userId) {
  try {
    const tx = await graphqlRequest(jwt, QUERY_XP_TRANSACTIONS, { userId });
    return tx.transaction || [];
  } catch {
    const minimal = `
      query XpTxMinimal($userId: Int!) {
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
    const tx = await graphqlRequest(jwt, minimal, { userId });
    return tx.transaction || [];
  }
}

export async function loadProfileData(jwt) {
  const jwtId = getUserIdFromJwt(jwt);

  const userData = await graphqlRequest(jwt, QUERY_USER_NORMAL);
  const users = userData.user || [];
  const me = matchUserRow(users, jwtId);
  if (!me?.id) {
    throw new Error('Could not find your user.');
  }

  const userId = coerceUserId(me.id);
  if (userId == null) {
    throw new Error('Invalid user id.');
  }

  let results = [];
  try {
    const nested = await graphqlRequest(jwt, QUERY_RESULTS_NESTED, { userId });
    results = nested.result || [];
  } catch {
    const fallback = `
      query ResultsNestedFallback($userId: Int!) {
        result(where: { userId: { _eq: $userId } }) {
          id
          grade
          user { id login }
        }
      }
    `;
    const nested = await graphqlRequest(jwt, fallback, { userId });
    results = nested.result || [];
  }

  const firstWithObj = results.find((r) => r.object?.id != null);
  const objectId =
    firstWithObj?.object?.id != null ? firstWithObj.object.id : 3323;

  let objects = [];
  try {
    const objData = await graphqlRequest(jwt, QUERY_OBJECT_BY_ID, {
      id: parseInt(String(objectId), 10) || 3323,
    });
    objects = objData.object || [];
  } catch {
    objects = [];
  }

  let xpSum = 0;
  try {
    const agg = await graphqlRequest(jwt, QUERY_XP_AGGREGATE, { userId });
    const sumAmt = agg.transaction_aggregate?.aggregate?.sum;
    if (sumAmt?.amount != null) xpSum = Number(sumAmt.amount) || 0;
  } catch {
    try {
      const agg = await graphqlRequest(
        jwt,
        `query XpSumValue($userId: Int!) {
          transaction_aggregate(
            where: { _and: [{ type: { _eq: "xp" } }, { userId: { _eq: $userId } }] }
          ) {
            aggregate { sum { value } }
          }
        }`,
        { userId }
      );
      const sumAmt = agg.transaction_aggregate?.aggregate?.sum;
      if (sumAmt?.value != null) xpSum = Number(sumAmt.value) || 0;
    } catch {
      xpSum = 0;
    }
  }

  const txRows = await fetchXpTransactions(jwt, userId);
  if ((!xpSum || xpSum === 0) && txRows.length) {
    xpSum = txRows.reduce((s, r) => s + transactionAmount(r), 0);
  }

  let progressRows = [];
  try {
    const pr = await graphqlRequest(jwt, QUERY_PROGRESS, { userId });
    progressRows = pr.progress || [];
  } catch {
    try {
      const pr = await graphqlRequest(
        jwt,
        `query P($userId: Int!) { progress(where: { userId: { _eq: $userId } }, limit: 5) { id } }`,
        { userId }
      );
      progressRows = pr.progress || [];
    } catch {
      progressRows = [];
    }
  }

  return {
    jwtId,
    userId,
    me,
    users,
    results,
    objects,
    xpSum,
    txRows,
    progressRows,
  };
}

export { transactionAmount };
