import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SpotlightHero from "@/components/hero/SpotlightHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import {
  STAKE_ERRORS,
  claimStakeYield,
  createStake,
  getStakingOverview,
  unstake,
  type StakeRecord,
  type StakingPlan,
} from "@/lib/staking-api";

const fmt = (n: number, d = 4) =>
  Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: d });

const label = (c: string) => (c === "ton" ? "Gram" : "$NOVA");

const timeLeft = (iso: string) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Matured";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
};

const StakingPage = () => {
  const { user, refreshProfile } = useApp();
  const { toast } = useToast();
  const [tab, setTab] = useState<"plans" | "mine">("plans");
  const [plans, setPlans] = useState<StakingPlan[]>([]);
  const [stakes, setStakes] = useState<StakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<StakingPlan | null>(null);
  const [amount, setAmount] = useState("");
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await getStakingOverview(user.telegramUser.id);
      setPlans(res?.plans ?? []);
      setStakes(res?.stakes ?? []);
    } catch (e) {
      console.error("staking load failed", e);
    } finally {
      setLoading(false);
    }
  }, [user.telegramUser.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const active = useMemo(() => stakes.filter((s) => s.status === "active"), [stakes]);

  const totals = useMemo(() => {
    const t = { ton: 0, siri: 0 };
    active.forEach((s) => {
      t[s.currency] += Number(s.amount || 0);
    });
    return t;
  }, [active]);

  const balanceFor = (c: string) => (c === "ton" ? user.tonBalance : user.siriBalance);

  const openPlan = (p: StakingPlan) => {
    setSelected(p);
    setAmount(String(p.min_amount));
  };

  const submit = async () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await createStake(user.telegramUser.id, selected.id, amt);
      if (!res?.success) {
        toast({ title: STAKE_ERRORS[res?.error ?? ""] ?? "Failed to stake", variant: "destructive" });
        return;
      }
      toast({ title: "Bond opened", description: `${fmt(amt)} ${label(selected.currency)} locked for ${selected.duration_days} days` });
      setSelected(null);
      await Promise.all([load(), refreshProfile()]);
      setTab("mine");
    } catch (e) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const doClaim = async (s: StakeRecord) => {
    setBusy(true);
    try {
      const res = await claimStakeYield(user.telegramUser.id, s.id);
      if (!res?.success) {
        toast({ title: STAKE_ERRORS[res?.error ?? ""] ?? "Claim failed", variant: "destructive" });
        return;
      }
      toast({ title: "Yield claimed", description: `+${fmt(Number(res.claimed))} ${label(s.currency)}` });
      await Promise.all([load(), refreshProfile()]);
    } finally {
      setBusy(false);
    }
  };

  const doUnstake = async (s: StakeRecord) => {
    const early = new Date(s.ends_at).getTime() > Date.now();
    if (early && !window.confirm(`Early exit fee is ${s.early_exit_fee_pct}% and you lose unclaimed yield. Continue?`)) return;
    setBusy(true);
    try {
      const res = await unstake(user.telegramUser.id, s.id);
      if (!res?.success) {
        toast({ title: STAKE_ERRORS[res?.error ?? ""] ?? "Unstake failed", variant: "destructive" });
        return;
      }
      toast({
        title: res.early ? "Early exit" : "Bond matured",
        description: `+${fmt(Number(res.payout))} ${label(s.currency)}${Number(res.fee) > 0 ? ` · fee ${fmt(Number(res.fee))}` : ""}`,
      });
      await Promise.all([load(), refreshProfile()]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      <SpotlightHero title="Bonds">
        <div className="px-5 pt-[26vh]">
          {/* Summary */}
          <motion.div
            className="rounded-3xl glass glass-panel p-6 mb-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2 text-center">
              Total Locked
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="rounded-2xl border border-border bg-card/40 p-3.5">
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">Gram</p>
                <p className="text-xl font-display font-bold text-foreground">{fmt(totals.ton)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-card/40 p-3.5">
                <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">$NOVA</p>
                <p className="text-xl font-display font-bold text-foreground">{fmt(totals.siri, 2)}</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card/40 p-1">
            {(["plans", "mine"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-xl py-2 text-xs font-display uppercase tracking-widest transition-all ${
                  tab === t
                    ? "action-black"
                    : "text-muted-foreground"
                }`}
              >
                {t === "plans" ? "Plans" : `My Bonds (${active.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : tab === "plans" ? (
            <div className="space-y-3">
              {plans.map((p, i) => (
                <motion.button
                  key={p.id}
                  onClick={() => openPlan(p)}
                  className="w-full rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-4 text-left"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Lock {p.duration_days} days · min {fmt(p.min_amount, 2)} {label(p.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                      <div>
                        <p className="text-lg font-display font-bold text-neon-green">{fmt(p.apr, 1)}%</p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">APR</p>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stakes.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">No bonds yet</p>
              )}
              {stakes.map((s) => {
                const matured = new Date(s.ends_at).getTime() <= Date.now();
                const closed = s.status !== "active";
                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-border bg-card/40 backdrop-blur-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.plan_name}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {fmt(s.amount, 2)} {label(s.currency)} · {fmt(s.apr, 1)}% APR
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-widest ${
                          closed
                            ? "bg-muted/40 text-muted-foreground"
                            : matured
                            ? "bg-neon-green/15 text-neon-green"
                            : "bg-primary/15 text-primary"
                        }`}
                      >
                        {closed ? (s.status === "early_closed" ? "Early exit" : "Closed") : matured ? "Matured" : "Locked"}
                      </span>
                    </div>

                    {!closed && (
                      <>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-border/60 bg-background/30 p-2.5">
                            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Unlocks</p>
                            <p className="text-sm font-display text-foreground">{timeLeft(s.ends_at)}</p>
                          </div>
                          <div className="rounded-xl border border-border/60 bg-background/30 p-2.5">
                            <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">Pending</p>
                            <p className="text-sm font-display text-neon-green">
                              {fmt(s.pending_yield)} {label(s.currency)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            disabled={busy || Number(s.pending_yield) <= 0}
                            onClick={() => doClaim(s)}
                            className="h-10 rounded-xl font-display text-xs"
                          >
                            Claim yield
                          </Button>
                          <Button
                            disabled={busy}
                            onClick={() => doUnstake(s)}
                            variant="outline"
                            className="h-10 rounded-xl border-border bg-card/40 font-display text-xs"
                          >
                            {matured ? "Withdraw" : `Exit · -${fmt(s.early_exit_fee_pct, 0)}%`}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SpotlightHero>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.name}</DialogTitle>
            <DialogDescription>
              Lock {label(selected?.currency ?? "ton")} for {selected?.duration_days} days at{" "}
              {fmt(selected?.apr ?? 0, 1)}% APR. Early exit costs {fmt(selected?.early_exit_fee_pct ?? 0, 0)}% of
              principal and forfeits unclaimed yield.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Available</span>
              <span className="text-foreground">
                {fmt(balanceFor(selected?.currency ?? "ton"), 4)} {label(selected?.currency ?? "ton")}
              </span>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="h-12 rounded-2xl"
            />
            <div className="rounded-2xl border border-border bg-card/40 p-3 text-xs text-muted-foreground">
              Estimated return at maturity:{" "}
              <span className="text-neon-green font-display">
                {fmt(
                  (Number(amount) || 0) *
                    ((selected?.apr ?? 0) / 100) *
                    ((selected?.duration_days ?? 0) / 365),
                )}{" "}
                {label(selected?.currency ?? "ton")}
              </span>
            </div>
            <Button onClick={submit} disabled={busy} className="h-12 w-full rounded-2xl font-display glow-primary gap-2">
              Lock now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StakingPage;
