import axios from 'axios';
import type { Expense, ExpenseInput } from '../types/expense';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const expenseApi = {
  // Get all expenses
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get<Expense[]>('/expenses');
    return response.data;
  },

  // Get expense by ID
  getById: async (id: string): Promise<Expense> => {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  // Create expense
  create: async (expense: ExpenseInput): Promise<Expense> => {
    const response = await api.post<Expense>('/expenses', expense);
    return response.data;
  },

  // Update expense
  update: async (id: string, expense: ExpenseInput): Promise<Expense> => {
    const response = await api.put<Expense>(`/expenses/${id}`, expense);
    return response.data;
  },

  // Delete expense
  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  // Ask AI question
  ask: async (question: string): Promise<{ answer: string }> => {
    const response = await api.post<{ answer: string }>(`/expenses/ask`, {
      question,
    });
    return response.data;
  },
};
