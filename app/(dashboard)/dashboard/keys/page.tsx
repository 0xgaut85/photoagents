"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Table } from "../../_components/ui";
import { type ApiKey, createKey, fetchKeys, revokeKey } from "../../_lib/api";
import { useDashboardAuth } from "../../_components/DashboardAuth";

export default function KeysPage() {
  const { apiFetch } = useDashboardAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [keyName, setKeyName] = useState("Production key");
  const [revealed, setRevealed] = useState("");
  const [copied, setCopied] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchKeys(apiFetch);
      setKeys(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeCount = useMemo(
    () => keys.filter((key) => key.status === "active").length,
    [keys],
  );

  const handleCreate = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { key, secret } = await createKey(apiFetch, keyName || "Untitled key");
      setKeys((current) => [key, ...current]);
      setRevealed(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setError(null);
    try {
      const updated = await revokeKey(apiFetch, id);
      setKeys((current) => current.map((key) => (key.id === id ? updated : key)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(""), 1400);
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-ink)]/55">
            API keys
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            Create the eyes.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-ink)]/65">
            Each key is shown exactly once. We only keep a hash. If you lose the
            secret, generate a new one.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Create key
        </Button>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-ink)]/55">Active keys</p>
          <p className="text-4xl font-extralight tracking-[-0.04em]">
            {loading ? "—" : activeCount}
          </p>
        </Card>
        <Card className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-ink)]/55">Total keys</p>
          <p className="text-4xl font-extralight tracking-[-0.04em]">
            {loading ? "—" : keys.length}
          </p>
        </Card>
      </section>

      <Card>
        {loading ? (
          <p className="py-12 text-center text-sm text-[var(--color-ink)]/55">
            Loading keys…
          </p>
        ) : keys.length === 0 ? (
          <EmptyState
            title="No keys yet"
            action={
              <Button onClick={() => setOpen(true)}>
                <KeyRound size={15} /> Create your first key
              </Button>
            }
          >
            Generate a key, drop it into your local config, and start sending
            images to the API.
          </EmptyState>
        ) : (
          <Table
            headers={["Name", "Key", "Created", "Last used", "Status", ""]}
            rows={keys.map((key) => [
              <span key="name" className="font-normal">
                {key.name}
              </span>,
              <code key="prefix" className="rounded-full bg-[var(--color-ink)]/[0.06] px-3 py-1 text-xs">
                {key.prefix}
              </code>,
              key.createdAt,
              key.lastUsed,
              <Badge key="status" tone={key.status === "active" ? "success" : "danger"}>
                {key.status}
              </Badge>,
              key.status === "active" ? (
                <Button key="revoke" variant="ghost" onClick={() => handleRevoke(key.id)}>
                  <Trash2 size={15} /> Revoke
                </Button>
              ) : (
                <span key="empty" className="text-[var(--color-ink)]/40">
                  —
                </span>
              ),
            ])}
          />
        )}
      </Card>

      <Modal
        open={open}
        title={revealed ? "Copy this key now" : "Create a new API key"}
        onClose={() => {
          setOpen(false);
          setRevealed("");
          setKeyName("Production key");
        }}
      >
        {revealed ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-relaxed text-[var(--color-ink)]/65">
              This is the only time the full secret will be shown. Store it
              somewhere safe.
            </p>
            <code className="break-all rounded-2xl border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/40 p-4 text-sm">
              {revealed}
            </code>
            <Button onClick={() => copyText(revealed)}>
              {copied === revealed ? <Check size={16} /> : <Copy size={16} />}
              {copied === revealed ? "Copied" : "Copy key"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="text-sm text-[var(--color-ink)]/65">
              Key name
              <Input
                className="mt-2"
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
              />
            </label>
            <Button onClick={handleCreate} disabled={submitting}>
              <KeyRound size={16} /> {submitting ? "Generating…" : "Generate key"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
