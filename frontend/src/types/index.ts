export interface User {
  id: number;
  email: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  user_id: number;
}

export interface Transaction {
  id: number;
  amount: number;
  description: string | null;
  date: string;
  category_id: number;
  user_id: number;
}

export interface Budget {
  id: number;
  month: string;
  limit_amount: number;
  category_id: number;
  user_id: number;
}

export interface CategorySummary {
  category_id: number;
  name: string;
  spent: number;
  limit: number | null;
  remaining: number | null;
  percentage: number | null;
  status: "under_budget" | "near_limit" | "over_budget" | "no_budget_set";
}

export interface MonthlySummary {
  month: string;
  total_income: number;
  total_spent: number;
  total_budget_limit: number;
  net: number;
  categories: CategorySummary[];
}

export interface Alert {
  category: string;
  severity: "high" | "warning";
  message: string;
  spent: number;
  limit: number;
}

export interface AlertsResponse {
  month: string;
  alert_count: number;
  alerts: Alert[];
}