import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  amount: number;
  description: string;
  category: string;
  date: Date;
  tags?: string[];
  paymentMethod?: string;
  receipt?: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    path: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    paymentMethod: {
      type: String,
      trim: true,
    },
    receipt: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      path: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
