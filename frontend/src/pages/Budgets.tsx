import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet } from "lucide-react";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "../api/budgets";
import { getCategories } from "../api/categories";
import { getMonthlySummary } from "../api/summary";
import { formatCurrency, getCurrentMonth } from "../utils/format";
import type { Budget } from "../types";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import StatusBadge from "../components/ui/StatusBadge";
import EmptyState from "../components/ui/EmptyState";

export default function Budgets() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(getCurrentMonth());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formMonth, setFormMonth] = useState(getCurrentMonth());
  const [formLimitAmount, setFormLimitAmount] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formError, setFormError] = useState("");

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", month],
    queryFn: () => getBudgets(month),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", month],
    queryFn: () => getMonthlySummary(month),
  });

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const categoryMap = categories.reduce((acc: Record<number, string>, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {});

  const summaryMap = (summary?.categories ?? []).reduce(
    (acc: Record<number, { spent: number; status: string; percentage: number | null }>, cat) => {
      acc[cat.category_id] = {
        spent: cat.spent,
        status: cat.status,
        percentage: cat.percentage,
      };
      return acc;
    },
    {}
  );

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      closeModal();
    },
    onError: () => setFormError("Budget may already exist for this category and month"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { month: string; limit_amount: number; category_id: number };
    }) => updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      closeModal();
    },
    onError: () => setFormError("Failed to update budget"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const openCreateModal = () => {
    setEditingBudget(null);
    setFormMonth(month);
    setFormLimitAmount("");
    setFormCategoryId(expenseCategories.length > 0 ? String(expenseCategories[0].id) : "");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setFormMonth(budget.month);
    setFormLimitAmount(String(budget.limit_amount));
    setFormCategoryId(String(budget.category_id));
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formLimitAmount || !formCategoryId || !formMonth) {
      setFormError("Please fill in all fields");
      return;
    }

    const data = {
      month: formMonth,
      limit_amount: parseFloat(formLimitAmount),
      category_id: Number(formCategoryId),
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this budget?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (summaryMap[b.category_id]?.spent ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Budgets</h1>
          <p className="text-text-secondary text-sm mt-1">Set and track spending limits</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-bg-card border border-border rounded-lg px-4 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
          />
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Set Budget
          </Button>
        </div>
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <p className="text-text-secondary text-sm mb-1">Total Budget</p>
            <p className="text-2xl font-bold font-display">{formatCurrency(totalBudget)}</p>
          </Card>
          <Card>
            <p className="text-text-secondary text-sm mb-1">Total Spent</p>
            <p className="text-2xl font-bold font-display">{formatCurrency(totalSpent)}</p>
          </Card>
          <Card>
            <p className="text-text-secondary text-sm mb-1">Remaining</p>
            <p
              className={`text-2xl font-bold font-display ${
                totalBudget - totalSpent >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(totalBudget - totalSpent)}
            </p>
          </Card>
        </div>
      )}

      {budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Wallet size={40} />}
            title="No budgets set"
            description="Set spending limits for your categories to stay on track."
            action={
              <Button onClick={openCreateModal}>
                <Plus size={16} />
                Set Budget
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const catName = categoryMap[budget.category_id] ?? "Unknown";
            const catSummary = summaryMap[budget.category_id];
            const spent = catSummary?.spent ?? 0;
            const percentage = catSummary?.percentage ?? 0;
            const status = (catSummary?.status ?? "under_budget") as
              | "under_budget"
              | "near_limit"
              | "over_budget"
              | "no_budget_set";
            const remaining = budget.limit_amount - spent;

            return (
              <Card key={budget.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Wallet size={18} className="text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-text-primary">{catName}</h3>
                        <StatusBadge status={status} />
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatCurrency(spent)} of {formatCurrency(budget.limit_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(budget)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-3 bg-bg-hover rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        status === "over_budget"
                          ? "bg-danger"
                          : status === "near_limit"
                          ? "bg-warning"
                          : "bg-accent"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">{percentage}% used</span>
                    <span
                      className={`font-medium ${remaining >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {remaining >= 0
                        ? `${formatCurrency(remaining)} remaining`
                        : `${formatCurrency(Math.abs(remaining))} over`}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingBudget ? "Edit Budget" : "Set Budget"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <Select
            label="Category"
            value={formCategoryId}
            onChange={(e) => setFormCategoryId(e.target.value)}
            options={expenseCategories.map((cat) => ({
              value: String(cat.id),
              label: cat.name,
            }))}
            required
          />

          <Input
            label="Monthly Limit"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formLimitAmount}
            onChange={(e) => setFormLimitAmount(e.target.value)}
            required
          />

          <Input
            label="Month"
            type="month"
            value={formMonth}
            onChange={(e) => setFormMonth(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingBudget ? "Update" : "Set Budget"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
