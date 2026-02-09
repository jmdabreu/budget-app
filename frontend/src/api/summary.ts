import client from "./client";
import type { MonthlySummary, AlertsResponse } from "../types";

export const getMonthlySummary = async (month: string): Promise<MonthlySummary> => {
  const response = await client.get(`/summary/monthly/${month}`);
  return response.data;
};

export const getAlerts = async (month: string): Promise<AlertsResponse> => {
  const response = await client.get(`/summary/alerts/${month}`);
  return response.data;
};