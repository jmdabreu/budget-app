import client from "./client";
import type { Category } from "../types";

export const getCategories = async (): Promise<Category[]> => {
  const response = await client.get("/categories/");
  return response.data;
};

export const createCategory = async (data: { name: string; type: string }): Promise<Category> => {
  const response = await client.post("/categories/", data);
  return response.data;
};

export const updateCategory = async (id: number, data: { name: string; type: string }): Promise<Category> => {
  const response = await client.put(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await client.delete(`/categories/${id}`);
};