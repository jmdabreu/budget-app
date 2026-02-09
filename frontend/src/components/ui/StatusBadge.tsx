interface StatusBadgeProps {
  status: "under_budget" | "near_limit" | "over_budget" | "no_budget_set";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    under_budget: "bg-success/10 text-success border-success/20",
    near_limit: "bg-warning/10 text-warning border-warning/20",
    over_budget: "bg-danger/10 text-danger border-danger/20",
    no_budget_set: "bg-bg-hover text-text-muted border-border",
  };

  const labels = {
    under_budget: "On Track",
    near_limit: "Near Limit",
    over_budget: "Over Budget",
    no_budget_set: "No Budget",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}