import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { getMonthlySummary, getAlerts } from "../api/summary";
import { formatCurrency, getCurrentMonth } from "../utils/format";
import Card from "../components/ui/Card";
import StatusBadge from "../components/ui/StatusBadge";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#22C55E", "#06B6D4", "#EF4444", "#14B8A6"];

export default function Dashboard() {
  const [month, setMonth] = useState(getCurrentMonth());

  const { data: summary, isLoading } = useQuery({
    queryKey: ["summary", month],
    queryFn: () => getMonthlySummary(month),
  });

  const { data: alertsData } = useQuery({
    queryKey: ["alerts", month],
    queryFn: () => getAlerts(month),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const pieData =
    summary?.categories
      .filter((c) => c.spent > 0)
      .map((c) => ({ name: c.name, value: c.spent })) ?? [];

  const barData =
    summary?.categories.map((c) => ({
      name: c.name,
      spent: c.spent,
      limit: c.limit ?? 0,
    })) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-text-secondary text-sm mt-1">Your financial overview</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="bg-bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">Total Income</span>
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp size={16} className="text-success" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display">
            {formatCurrency(summary?.total_income ?? 0)}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">Total Spent</span>
            <div className="p-2 bg-danger/10 rounded-lg">
              <TrendingDown size={16} className="text-danger" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display">
            {formatCurrency(summary?.total_spent ?? 0)}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">Net Balance</span>
            <div
              className={`p-2 rounded-lg ${
                (summary?.net ?? 0) >= 0 ? "bg-success/10" : "bg-danger/10"
              }`}
            >
              {(summary?.net ?? 0) >= 0 ? (
                <ArrowUpRight size={16} className="text-success" />
              ) : (
                <ArrowDownRight size={16} className="text-danger" />
              )}
            </div>
          </div>
          <p
            className={`text-2xl font-bold font-display ${
              (summary?.net ?? 0) >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatCurrency(summary?.net ?? 0)}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-text-secondary text-sm">Budget Used</span>
            <div className="p-2 bg-accent/10 rounded-lg">
              <Wallet size={16} className="text-accent" />
            </div>
          </div>
          <p className="text-2xl font-bold font-display">
            {summary?.total_budget_limit
              ? `${Math.round((summary.total_spent / summary.total_budget_limit) * 100)}%`
              : "N/A"}
          </p>
        </Card>
      </div>

      {alertsData && alertsData.alert_count > 0 && (
        <Card className="border-warning/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-warning" />
            <h2 className="text-lg font-semibold font-display">Budget Alerts</h2>
            <span className="bg-warning/10 text-warning text-xs font-medium px-2 py-0.5 rounded-full">
              {alertsData.alert_count}
            </span>
          </div>
          <div className="space-y-3">
            {alertsData.alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  alert.severity === "high"
                    ? "bg-danger/5 border-danger/20"
                    : "bg-warning/5 border-warning/20"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{alert.category}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{alert.message}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    alert.severity === "high"
                      ? "bg-danger/10 text-danger"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {alert.severity === "high" ? "Critical" : "Warning"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold font-display mb-6">Spending by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2035",
                    border: "1px solid #2A3349",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                    fontSize: "13px",
                  }}
                  formatter={(value: unknown) => [formatCurrency(value as number), "Spent"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-text-muted text-sm">
              No spending data this month
            </div>
          )}
          <div className="flex flex-wrap gap-3 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-text-secondary">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold font-display mb-6">Budget vs Spending</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barGap={4}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={{ stroke: "#2A3349" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748B", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2035",
                    border: "1px solid #2A3349",
                    borderRadius: "8px",
                    color: "#F1F5F9",
                    fontSize: "13px",
                  }}
                  formatter={(value: unknown) => formatCurrency(value as number)}
                />
                <Bar dataKey="limit" fill="#2A3349" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="spent" fill="#6366F1" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-text-muted text-sm">
              No budget data this month
            </div>
          )}
        </Card>
      </div>

      {summary && summary.categories.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold font-display mb-6">Category Breakdown</h2>
          <div className="space-y-4">
            {summary.categories.map((cat) => (
              <div key={cat.category_id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-text-primary">{cat.name}</span>
                    <StatusBadge status={cat.status} />
                  </div>
                  <div className="text-sm text-text-secondary">
                    {formatCurrency(cat.spent)}
                    {cat.limit !== null && (
                      <span className="text-text-muted"> / {formatCurrency(cat.limit)}</span>
                    )}
                  </div>
                </div>
                {cat.limit !== null && (
                  <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.status === "over_budget"
                          ? "bg-danger"
                          : cat.status === "near_limit"
                          ? "bg-warning"
                          : "bg-accent"
                      }`}
                      style={{ width: `${Math.min(cat.percentage ?? 0, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}