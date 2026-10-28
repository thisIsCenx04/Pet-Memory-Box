import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { clientIp, hashIp, isRateLimited, lookupPublicProfile, shortUserAgent } from "./services/public-profile";

/** Một lần tra cứu cho mỗi request, dùng chung giữa generateMetadata và trang. */
export const resolvePublicRequest = cache(async (token: string) => {
  const h = await headers();
  const ipHash = hashIp(clientIp(h));
  if (await isRateLimited(ipHash)) return { limited: true as const };
  const lookup = await lookupPublicProfile(token);
  return { limited: false as const, lookup, ipHash, userAgent: shortUserAgent(h.get("user-agent")) };
});
