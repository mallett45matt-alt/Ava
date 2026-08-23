"use client";

import { useState } from "react";
import type Anthropic from "@anthropic-ai/sdk";
import { Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  sendAvaMessage,
  confirmAvaAction,
  cancelAvaAction,
  type AvaPendingAction,
} from "@/server/ava/chat";

type DisplayMessage = { role: "user" | "assistant"; text: string };

export function AskAva() {
  const [apiHistory, setApiHistory] = useState<Anthropic.MessageParam[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [pendingAction, setPendingAction] = useState<AvaPendingAction | null>(null);
  const [input, setInput] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;

    setInput("");
    setError(null);
    setDisplayMessages((prev) => [...prev, { role: "user", text }]);
    setIsBusy(true);
    try {
      const result = await sendAvaMessage(apiHistory, text);
      applyResult(result);
    } finally {
      setIsBusy(false);
    }
  }

  function applyResult(result: Awaited<ReturnType<typeof sendAvaMessage>>) {
    setApiHistory(result.history);
    if (result.notConfigured) {
      setNotConfigured(true);
      return;
    }
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.assistantText) {
      setDisplayMessages((prev) => [...prev, { role: "assistant", text: result.assistantText! }]);
    }
    setPendingAction(result.pendingAction);
  }

  async function handleConfirm() {
    if (!pendingAction) return;
    setIsBusy(true);
    try {
      const result = await confirmAvaAction(apiHistory, pendingAction);
      setPendingAction(null);
      applyResult(result);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCancel() {
    if (!pendingAction) return;
    setIsBusy(true);
    try {
      const result = await cancelAvaAction(apiHistory, pendingAction);
      setPendingAction(null);
      applyResult(result);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Sparkles size={18} className="text-accent" />
        <p className="text-sm font-semibold">Ask Ava</p>
      </div>

      {(displayMessages.length > 0 || notConfigured || error) && (
        <div className="max-h-80 space-y-3 overflow-y-auto px-5 py-4">
          {displayMessages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user" ? "bg-accent text-accent-foreground" : "bg-background text-foreground",
                )}
              >
                {m.text}
              </p>
            </div>
          ))}

          {notConfigured && (
            <p className="rounded-xl bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
              Ava needs an Anthropic API key to chat. Add <code>ANTHROPIC_API_KEY</code> to your
              environment settings to turn her on.
            </p>
          )}

          {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}

          {pendingAction && (
            <div className="rounded-xl border border-accent/30 bg-accent-soft p-3.5">
              <p className="text-sm font-medium text-accent">{pendingAction.summary}</p>
              <div className="mt-2.5 flex gap-2">
                <Button type="button" size="sm" onClick={handleConfirm} disabled={isBusy}>
                  Confirm
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={handleCancel} disabled={isBusy}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {isBusy && !pendingAction && <p className="text-sm text-muted">Ava is thinking…</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What do I have on tomorrow?"
          disabled={isBusy || !!pendingAction}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isBusy || !!pendingAction || !input.trim()}
          aria-label="Send"
        >
          <Send size={16} />
        </Button>
      </form>
    </Card>
  );
}
