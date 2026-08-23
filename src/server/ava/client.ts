import "server-only";

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null | undefined;

/** Returns null (rather than throwing) when no API key is configured, so
 * the UI can show a friendly "Ava isn't set up yet" state instead of a
 * crash — this app should run and be useful even before an owner adds
 * their Anthropic API key. */
export function getAvaClient(): Anthropic | null {
  if (client !== undefined) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  client = apiKey ? new Anthropic({ apiKey }) : null;
  return client;
}

export const AVA_MODEL = "claude-opus-5";
export const AVA_MAX_TOKENS = 2048;
