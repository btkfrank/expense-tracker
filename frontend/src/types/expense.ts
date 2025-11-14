export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  tags?: string[];
  paymentMethod?: string;
  receipt?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  amount: number;
  description: string;
  category: string;
  date: string;
  tags?: string[];
  paymentMethod?: string;
}
