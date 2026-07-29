"use client";

import { useState, useEffect } from "react";
import { Shield, Users, FileText, Activity, Key, Database, AlertTriangle, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface AdminStats {
  users: { total: number; verified: number; unverified: number; deleted: number; signups7d: number };
  prompts: { total: number; enhanced: number; avgScore: number };
  usage: {
    daily: number; weekly: number; monthly: number;
    tokensIn: number; tokensOut: number;
    byAction: { action: string; _count: number }[];
    byProvider: { provider: string; _count: number }[];
  };
  apiKeys: { total: number; byProvider: { provider: string; _count: number }[] };
  content: { collections: number; templates: number };
  recentLogs: { id: string; userId: string; action: string; provider: string | null; model: string | null; success: boolean; tokensIn: number | null; tokensOut: number | null; createdAt: string }[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetch("/api/v1/admin/stats")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) { setError(json.error); return; }
        setStats(json.data);
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2"><Shield className="h-5 w-5" /><h2 className="font-semibold text-sm">Admin Panel</h2></div>
        <div className="p-6 rounded-lg border bg-card text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Access Denied</p>
          <p className="text-xs text-muted-foreground mt-1">Set ADMIN_EMAIL in your environment variables to access the admin panel.</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const StatCard = ({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: typeof Users; color: string }) => (
    <div className="p-4 rounded-xl border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h2 className="font-semibold text-sm">Admin Panel</h2>
        <span className="text-xs text-muted-foreground ml-auto">Live data from production DB</span>
      </div>

      {/* Users */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Users</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total" value={stats.users.total} icon={Users} color="text-blue-500" sub={`${stats.users.signups7d} this week`} />
          <StatCard label="Verified" value={stats.users.verified} icon={Users} color="text-green-500" />
          <StatCard label="Unverified" value={stats.users.unverified} icon={Users} color="text-amber-500" />
          <StatCard label="Deleted" value={stats.users.deleted} icon={AlertTriangle} color="text-red-500" />
        </div>
      </div>

      {/* Prompts */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Prompts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total" value={stats.prompts.total} icon={FileText} color="text-violet-500" />
          <StatCard label="Enhanced" value={stats.prompts.enhanced} icon={FileText} color="text-emerald-500" sub={`${stats.prompts.total ? Math.round(stats.prompts.enhanced / stats.prompts.total * 100) : 0}% of total`} />
          <StatCard label="Avg Score" value={typeof stats.prompts.avgScore === 'number' ? Math.round(stats.prompts.avgScore) : '—'} icon={Activity} color="text-amber-500" />
        </div>
      </div>

      {/* Usage */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> LLM Usage</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Today" value={stats.usage.daily} icon={Activity} color="text-cyan-500" />
          <StatCard label="This Week" value={stats.usage.weekly} icon={Activity} color="text-cyan-500" />
          <StatCard label="This Month" value={stats.usage.monthly} icon={Activity} color="text-cyan-500" />
          <StatCard label="Tokens In" value={(stats.usage.tokensIn / 1000).toFixed(0) + 'K'} icon={Database} color="text-purple-500" />
          <StatCard label="Tokens Out" value={(stats.usage.tokensOut / 1000).toFixed(0) + 'K'} icon={Database} color="text-purple-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-xs font-medium text-muted-foreground mb-2">By Action (7d)</p>
            <div className="space-y-1.5">
              {stats.usage.byAction.map((a) => (
                <div key={a.action} className="flex justify-between text-xs">
                  <span className="capitalize">{a.action}</span>
                  <span className="font-mono">{a._count}</span>
                </div>
              ))}
              {stats.usage.byAction.length === 0 && <p className="text-xs text-muted-foreground">No usage in last 7 days</p>}
            </div>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="text-xs font-medium text-muted-foreground mb-2">By Provider (7d)</p>
            <div className="space-y-1.5">
              {stats.usage.byProvider.map((p) => (
                <div key={p.provider} className="flex justify-between text-xs">
                  <span className="capitalize">{p.provider || 'unknown'}</span>
                  <span className="font-mono">{p._count}</span>
                </div>
              ))}
              {stats.usage.byProvider.length === 0 && <p className="text-xs text-muted-foreground">No usage in last 7 days</p>}
            </div>
          </div>
        </div>
      </div>

      {/* API Keys & Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-1.5 mb-2"><Key className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-semibold text-muted-foreground">API Keys</span></div>
          <p className="text-2xl font-bold">{stats.apiKeys.total}</p>
          <div className="space-y-1 mt-2">
            {stats.apiKeys.byProvider.map((k) => (
              <div key={k.provider} className="flex justify-between text-xs">
                <span className="capitalize">{k.provider}</span>
                <span className="font-mono">{k._count}</span>
              </div>
            ))}
            {stats.apiKeys.byProvider.length === 0 && <p className="text-xs text-muted-foreground">No API keys configured</p>}
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center gap-1.5 mb-2"><Database className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-semibold text-muted-foreground">Content</span></div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div><p className="text-xs text-muted-foreground">Collections</p><p className="text-xl font-bold">{stats.content.collections}</p></div>
            <div><p className="text-xs text-muted-foreground">Templates</p><p className="text-xl font-bold">{stats.content.templates}</p></div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div>
        <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground">
          <Database className="h-3.5 w-3.5" /> Recent Activity ({stats.recentLogs.length})
          {showLogs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {showLogs && (
          <div className="rounded-xl border bg-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Action</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Provider</th>
                  <th className="text-left p-2 font-medium text-muted-foreground">Model</th>
                  <th className="text-right p-2 font-medium text-muted-foreground">Tokens</th>
                  <th className="text-center p-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-accent/30">
                    <td className="p-2 text-muted-foreground font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-2 font-mono text-[10px]">{log.userId.slice(0, 8)}…</td>
                    <td className="p-2 capitalize">{log.action}</td>
                    <td className="p-2">{log.provider || '—'}</td>
                    <td className="p-2 max-w-[120px] truncate">{log.model || '—'}</td>
                    <td className="p-2 text-right font-mono">{(log.tokensIn || 0) + (log.tokensOut || 0)}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
