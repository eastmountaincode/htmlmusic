import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Param = string | number | null;

type D1HttpError = {
  code?: number;
  message?: string;
};

type D1HttpQueryResult<Row> = {
  results?: Row[];
  success?: boolean;
};

type D1HttpResponse<Row> = {
  errors?: D1HttpError[];
  result?: D1HttpQueryResult<Row>[];
  success?: boolean;
};

type D1HttpConfig = {
  accountId: string;
  apiToken: string;
  databaseId: string;
};

function getD1HttpConfig(): D1HttpConfig | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN?.trim();
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID?.trim();
  const hasHttpConfig = Boolean(accountId || apiToken || databaseId);

  if (!hasHttpConfig) return null;

  if (!accountId || !apiToken || !databaseId) {
    throw new Error("D1 HTTP configuration is incomplete.");
  }

  return { accountId, apiToken, databaseId };
}

function getD1ErrorMessage(payload: D1HttpResponse<unknown>, status: number) {
  const messages = payload.errors
    ?.map((error) => error.message?.trim())
    .filter((message): message is string => Boolean(message));

  return messages?.length
    ? messages.join("; ")
    : `D1 request failed with status ${status}.`;
}

async function queryD1OverHttp<Row>(
  config: D1HttpConfig,
  sql: string,
  params: D1Param[],
) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      config.accountId,
    )}/d1/database/${encodeURIComponent(config.databaseId)}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ params, sql }),
      cache: "no-store",
    },
  );
  const responseText = await response.text();
  let payload: D1HttpResponse<Row>;

  try {
    payload = JSON.parse(responseText) as D1HttpResponse<Row>;
  } catch {
    throw new Error(
      `D1 returned an invalid response with status ${response.status}.`,
    );
  }

  const queryResult = payload.result?.[0];

  if (
    !response.ok ||
    payload.success !== true ||
    !queryResult ||
    queryResult.success === false
  ) {
    throw new Error(getD1ErrorMessage(payload, response.status));
  }

  return queryResult.results ?? [];
}

export async function queryD1<Row>(sql: string, params: D1Param[] = []) {
  const httpConfig = getD1HttpConfig();

  if (httpConfig) {
    return queryD1OverHttp<Row>(httpConfig, sql, params);
  }

  const result = await getCloudflareContext()
    .env.DB.prepare(sql)
    .bind(...params)
    .all<Row>();

  return result.results;
}

export async function runD1(sql: string, params: D1Param[] = []) {
  const httpConfig = getD1HttpConfig();

  if (httpConfig) {
    await queryD1OverHttp(httpConfig, sql, params);
    return;
  }

  await getCloudflareContext()
    .env.DB.prepare(sql)
    .bind(...params)
    .run();
}
