"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { Badge, Button, Card, Input, Modal, Table } from "../../_components/ui";
import { type ApiKey, mockKeys } from "../../_lib/mock";
import { createKey as apiCreateKey, fetchKeys, revokeKey as apiRevokeKey } from "../../_lib/api";
import { useDashboardAuth } from "../../_components/DashboardAuth";

function newMockSecret() {
  return `pk_live_${crypto.randomUUID().replaceAll("-", "").slice(0, 28)}`;
}

export default function KeysPage() {
  const { apiFetch, mockMode } = useDashboardAuth();
  const [keys, setKeys] = useState<ApiKey[]>(mockMode ? mockKeys : []);
  const [loading, setLoading] = useState(!mockMode);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [keyName, setKeyName] = useState("New production key");
  const [revealed, setRevealed] = useState("");
  const [copied, setCopied] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (mockMode) return;
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
  }, [apiFetch, mockMode]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeCount = useMemo(
    () => keys.filter((key) => key.status === "active").length,
    [keys],
  );

  const handleCreate = async () => {
    setError(null);
    if (mockMode) {
      const secret = newMockSecret();
      const next: ApiKey = {
        id: crypto.randomUUID(),
        name: keyName || "Untitled key",
        prefix: `${secret.slice(0, 8)}••••${secret.slice(-4)}`,
        createdAt: "Today",
        lastUsed: "Never",
        status: "active",
      };
      setKeys((current) => [next, ...current]);
      setRevealed(secret);
      return;
    }

    setSubmitting(true);
    try {
      const { key, secret } = await apiCreateKey(apiFetch, keyName || "Untitled key");
      setKeys((current) => [key, ...current]);
      setRevealed(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (mockMode) {
      setKeys((current) =>
        current.map((key) => (key.id === id ? { ...key, status: "revoked" } : key)),
      );
      return;
    }
    setError(null);
    try {
      const updated = await apiRevokeKey(apiFetch, id);
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
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-muted)]">
            API keys
          </p>
          <h2 className="mt-4 text-5xl font-extralight tracking-[-0.06em]">
            Create the eyes.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-muted)]">
            {mockMode
              ? "Local mock mode — keys never leave the browser. Set NEXT_PUBLIC_PRIVY_APP_ID to switch to the real backend."
              : "Each key is shown exactly once. Store it somewhere safe; we only keep a hash."}
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Create key
        </Button>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-sm text-red-700">{error}</Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Active keys</p>
          <p className="mt-3 text-4xl font-extralight">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Total keys</p>
          <p className="mt-3 text-4xl font-extralight">{keys.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-[var(--color-muted)]">Mode</p>
          <p className="mt-3 text-4xl font-extralight">{mockMode ? "Mock" : "Live"}</p>
        </Card>
      </section>

      <Card>
        {loading ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            No keys yet. Create one to start hitting the API.
          </p>
        ) : (
          <Table
            headers={["Name", "Key", "Created", "Last used", "Status", ""]}
            rows={keys.map((key) => [
              <span key="name" className="font-normal">
                {key.name}
              </span>,
              <code key="prefix" className="rounded-full bg-[var(--color-line)] px-3 py-1 text-xs">
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
                <span key="empty" className="text-[var(--color-muted)]">
                  -
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
          setKeyName("New production key");
        }}
      >
        {revealed ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              This is the only time the full secret will be shown.
            </p>
            <code className="break-all rounded-2xl bg-white p-4 text-sm">{revealed}</code>
            <Button onClick={() => copyText(revealed)}>
              {copied === revealed ? <Check size={16} /> : <Copy size={16} />}
              {copied === revealed ? "Copied" : "Copy key"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="text-sm text-[var(--color-muted)]">
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
