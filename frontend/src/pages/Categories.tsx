import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tags, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../api/categories";
import type { Category } from "../types";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";

export default function Categories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("expense");
  const [formError, setFormError] = useState("");

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: () => setFormError("Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; type: string } }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeModal();
    },
    onError: () => setFormError("Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormType("expense");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      setFormError("Category name is required");
      return;
    }

    const data = { name: formName.trim(), type: formType };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Delete this category? All transactions in this category will also be deleted.")) {
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

  const renderCategoryCard = (category: Category) => (
    <div
      key={category.id}
      className="flex items-center justify-between p-4 bg-bg-hover/50 rounded-lg border border-border/50 hover:border-border transition-colors"
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${
            category.type === "income" ? "bg-success/10" : "bg-danger/10"
          }`}
        >
          {category.type === "income" ? (
            <ArrowUpRight size={16} className="text-success" />
          ) : (
            <ArrowDownRight size={16} className="text-danger" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{category.name}</p>
          <p className="text-xs text-text-muted capitalize">{category.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => openEditModal(category)}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => handleDelete(category.id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Categories</h1>
          <p className="text-text-secondary text-sm mt-1">Organize your transactions</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Tags size={40} />}
            title="No categories yet"
            description="Create categories to organize your income and expenses."
            action={
              <Button onClick={openCreateModal}>
                <Plus size={16} />
                Add Category
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-danger/10 rounded-lg">
                <ArrowDownRight size={16} className="text-danger" />
              </div>
              <h2 className="text-lg font-semibold font-display">Expense Categories</h2>
              <span className="text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">
                {expenseCategories.length}
              </span>
            </div>
            <div className="space-y-2">
              {expenseCategories.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">No expense categories</p>
              ) : (
                expenseCategories.map(renderCategoryCard)
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-success/10 rounded-lg">
                <ArrowUpRight size={16} className="text-success" />
              </div>
              <h2 className="text-lg font-semibold font-display">Income Categories</h2>
              <span className="text-xs text-text-muted bg-bg-hover px-2 py-0.5 rounded-full">
                {incomeCategories.length}
              </span>
            </div>
            <div className="space-y-2">
              {incomeCategories.length === 0 ? (
                <p className="text-sm text-text-muted py-4 text-center">No income categories</p>
              ) : (
                incomeCategories.map(renderCategoryCard)
              )}
            </div>
          </Card>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Name"
            type="text"
            placeholder="e.g. Groceries, Rent, Salary"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />

          <Select
            label="Type"
            value={formType}
            onChange={(e) => setFormType(e.target.value)}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
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
              {editingCategory ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}