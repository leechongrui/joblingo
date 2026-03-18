import { createHash } from "node:crypto";

export const makeDeckCacheKey = (payload: Record<string, string>) => {
  const digest = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");

  return `deck:${digest}`;
};
