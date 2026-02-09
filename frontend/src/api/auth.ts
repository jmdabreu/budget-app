import client from "./client";
import type { User, Token } from "../types";

export const register = async (email: string, password: string): Promise<User> => {
  const response = await client.post("/auth/register", { email, password });
  return response.data;
};

export const login = async (email: string, password: string): Promise<Token> => {
  const response = await client.post("/auth/login", { email, password });
  return response.data;
};