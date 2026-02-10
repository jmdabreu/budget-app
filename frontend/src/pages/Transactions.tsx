import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../api/transactions";
import { getCategories } from "../api/categories";
import { formatCurrency, formatDate, getCurrentMonth } from "../utils/format";
import type { Transaction, Category } from "../types";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";

export default function Transactions() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(getCurrentMonth());
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formError, setFormError] = useState("");

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", month, categoryFilter],
    queryFn: () =>
      getTransactions({
        month: month || undefined,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const categoryMap = categories.reduce((acc: Record<number, Category>, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery) return true;
    return (
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formatCurrency(t.amount).includes(searchQuery)
    );
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      closeModal();
    },
    onError: () => setFormError("Failed to create transaction"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateTransaction>[1] }) =>
      updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      closeModal();
    },
    onError: () => setFormError("Failed to update transaction"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const openCreateModal = () => {
    setEditingTransaction(null);
    setFormAmount("");
    setFormDescription("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCategoryId(categories.length > 0 ? String(categories[0].id) : "");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormAmount(String(transaction.amount));
    setFormDescription(transaction.description ?? "");
    setFormDate(transaction.date);
    setFormCategoryId(String(transaction.category_id));
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formAmount || !formDate || !formCategoryId) {
      setFormError("Please fill in all required fields");
      return;
    }

    const data = {
      amount: parseFloat(formAmount),
      description: formDescription || undefined,
      date: formDate,
      category_id: Number(formCategoryId),
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Transactions</h1>
          <p className="text-text-secondary text-sm mt-1">Track your income and expenses</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Add Transaction
        </Button>
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-border flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-bg-hover border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-bg-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-bg-hover border border-border rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<ArrowUpRight size={40} />}
            title="No transactions yet"
            description="Start tracking your spending by adding your first transaction."
            action={
              <Button onClick={openCreateModal}>
                <Plus size={16} />
                Add Transaction
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-6 py-3">
                    Description
                  </th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-6 py-3">
                    Category
                  </th>
                  <th className="text-left text-xs font-medium text-text-muted uppercase tracking-wider px-6 py-3">
                    Date
                  </th>
                  <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider px-6 py-3">
                    Amount
                  </th>
                  <th className="text-right text-xs font-medium text-text-muted uppercase tracking-wider px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => {
                  const category = categoryMap[transaction.category_id];
                  const isIncome = category?.type === "income";

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-border/50 hover:bg-bg-hover/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isIncome ? "bg-success/10" : "bg-danger/10"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight size={14} className="text-success" />
                            ) : (
                              <ArrowDownRight size={14} className="text-danger" />
                            )}
                          </div>
                          <span className="text-sm text-text-primary">
                            {transaction.description || "No description"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-bg-hover text-text-secondary px-2.5 py-1 rounded-full">
                          {category?.name ?? "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {formatDate(transaction.date)}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm font-medium text-right ${
                          isIncome ? "text-success" : "text-text-primary"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(transaction)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            required
          />

          <Input
            label="Description"
            type="text"
            placeholder="What was this for?"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />

          <Input
            label="Date"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            required
          />

          <Select
            label="Category"
            value={formCategoryId}
            onChange={(e) => setFormCategoryId(e.target.value)}
            options={categories.map((cat) => ({
              value: String(cat.id),
              label: `${cat.name} (${cat.type})`,
            }))}
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
              {editingTransaction ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}