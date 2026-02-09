import client from "./client";
import type { Transaction } from "../types";

export const getTransactions = async (params?: {
  category_id?: number;
  month?: string;
}): Promise<Transaction[]> => {
  const response = await client.get("/transactions/", { params });
  return response.data;
};

export const createTransaction = async (data: {
  amount: number;
  description?: string;
  date: string;
  category_id: number;
}): Promise<Transaction> => {
  const response = await client.post("/transactions/", data);
  return response.data;
};

export const updateTransaction = async (
  id: number,
  data: {
    amount?: number;
    description?: string;
    date?: string;
    category_id?: number;
  }
): Promise<Transaction> => {
  const response = await client.put(`/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await client.delete(`/transactions/${id}`);
};