"use server";

import Anthropic from "@anthropic-ai/sdk";
import { requireSession } from "@/server/auth/require";
import { getAvaClient, AVA_MODEL, AVA_MAX_TOKENS } from "@/server/ava/client";
import { buildSystemPrompt } from "@/server/ava/system-prompt";
import {
  AVA_TOOLS,
  isWriteTool,
  runReadTool,
  prepareWriteTool,
  executeWriteTool,
  type ReadToolName,
  type WriteToolName,
} from "@/server/ava/tools";

export type AvaPendingAction = {
  toolUseId: string;
  toolName: WriteToolName;
  input: Record<string, unknown>;
  summary: string;
  pendingReadResults: Anthropic.ToolResultBlockParam[];
};

export type AvaChatResult = {
  history: Anthropic.MessageParam[];
  assistantText: string | null;
  pendingAction: AvaPendingAction | null;
  notConfigured?: boolean;
  error?: string;
};

const MAX_ITERATIONS = 6;

function extractText(content: Anthropic.ContentBlock[]): string | null {
  const text = content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return text || null;
}

function describeApiError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "Ava's API key looks invalid. Check ANTHROPIC_API_KEY in your environment settings.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Ava is getting a lot of requests right now — try again in a moment.";
  }
  if (err instanceof Anthropic.APIError) {
    return `Ava hit an error talking to Claude: ${err.message}`;
  }
  return "Ava hit an unexpected error. Please try again.";
}

async function runLoop(
  startHistory: Anthropic.MessageParam[],
  system: string,
): Promise<AvaChatResult> {
  const client = getAvaClient();
  if (!client) {
    return { history: startHistory, assistantText: null, pendingAction: null, notConfigured: true };
  }

  let history = startHistory;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let response: Anthropic.Message;
    try {
      response = await client.messages.create({
        model: AVA_MODEL,
        max_tokens: AVA_MAX_TOKENS,
        system,
        tools: AVA_TOOLS,
        thinking: { type: "adaptive" },
        messages: history,
      });
    } catch (err) {
      return { history, assistantText: null, pendingAction: null, error: describeApiError(err) };
    }

    if (response.stop_reason === "tool_use") {
      history = [...history, { role: "assistant", content: response.content }];

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      const results: Anthropic.ToolResultBlockParam[] = [];
      let pendingWrite: Anthropic.ToolUseBlock | null = null;

      for (const block of toolUseBlocks) {
        if (isWriteTool(block.name)) {
          if (!pendingWrite) {
            pendingWrite = block;
          } else {
            // Claude asked for two actions in one turn — only one confirmation
            // card at a time; ask it to come back to the second afterwards.
            results.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: "Let's confirm one action at a time — bring this up again after the current one.",
              is_error: true,
            });
          }
          continue;
        }
        const content = await runReadTool(block.name as ReadToolName, (block.input ?? {}) as Record<string, unknown>);
        results.push({ type: "tool_result", tool_use_id: block.id, content });
      }

      if (pendingWrite) {
        const input = (pendingWrite.input ?? {}) as Record<string, unknown>;
        const prep = await prepareWriteTool(pendingWrite.name as WriteToolName, input);

        if (!prep.ok) {
          results.push({ type: "tool_result", tool_use_id: pendingWrite.id, content: prep.error, is_error: true });
          history = [...history, { role: "user", content: results }];
          continue;
        }

        return {
          history,
          assistantText: extractText(response.content),
          pendingAction: {
            toolUseId: pendingWrite.id,
            toolName: pendingWrite.name as WriteToolName,
            input,
            summary: prep.summary,
            pendingReadResults: results,
          },
        };
      }

      history = [...history, { role: "user", content: results }];
      continue;
    }

    if (response.stop_reason === "pause_turn") {
      history = [...history, { role: "assistant", content: response.content }];
      continue;
    }

    history = [...history, { role: "assistant", content: response.content }];
    const text = extractText(response.content);
    return {
      history,
      assistantText:
        response.stop_reason === "refusal" ? text || "Sorry, I can't help with that one." : text,
      pendingAction: null,
    };
  }

  return {
    history,
    assistantText: "That took a few too many steps — could you try rephrasing, maybe more specifically?",
    pendingAction: null,
  };
}

export async function sendAvaMessage(
  history: Anthropic.MessageParam[],
  userText: string,
): Promise<AvaChatResult> {
  const session = await requireSession();
  const system = buildSystemPrompt(session.businessName, session.name.split(" ")[0]);
  return runLoop([...history, { role: "user", content: userText }], system);
}

export async function confirmAvaAction(
  history: Anthropic.MessageParam[],
  pendingAction: AvaPendingAction,
): Promise<AvaChatResult> {
  const session = await requireSession();
  const system = buildSystemPrompt(session.businessName, session.name.split(" ")[0]);
  const resultText = await executeWriteTool(pendingAction.toolName, pendingAction.input);
  const results: Anthropic.ToolResultBlockParam[] = [
    ...pendingAction.pendingReadResults,
    { type: "tool_result", tool_use_id: pendingAction.toolUseId, content: resultText },
  ];
  return runLoop([...history, { role: "user", content: results }], system);
}

export async function cancelAvaAction(
  history: Anthropic.MessageParam[],
  pendingAction: AvaPendingAction,
): Promise<AvaChatResult> {
  const session = await requireSession();
  const system = buildSystemPrompt(session.businessName, session.name.split(" ")[0]);
  const results: Anthropic.ToolResultBlockParam[] = [
    ...pendingAction.pendingReadResults,
    {
      type: "tool_result",
      tool_use_id: pendingAction.toolUseId,
      content: "The user reviewed this and chose not to proceed.",
    },
  ];
  return runLoop([...history, { role: "user", content: results }], system);
}
