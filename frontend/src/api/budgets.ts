import client from "./client";
import type { Budget } from "../types";

export const getBudgets = async (month?: string): Promise<Budget[]> => {
  const response = await client.get("/budgets/", { params: month ? { month } : {} });
  return response.data;
};

export const createBudget = async (data: {
  month: string;
  limit_amount: number;
  category_id: number;
}): Promise<Budget> => {
  const response = await client.post("/budgets/", data);
  return response.data;
};

export const updateBudget = async (
  id: number,
  data: { month: string; limit_amount: number; category_id: number }
): Promise<Budget> => {
  const response = await client.put(`/budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id: number): Promise<void> => {
  await client.delete(`/budgets/${id}`);
};