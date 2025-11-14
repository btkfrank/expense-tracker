import { GraphQLResolveInfo } from 'graphql';
import Expense from '../models/Expense';
import { transformDocument, transformDocuments } from '../utils/mongoose.utils';

export const resolvers = {
  Query: {
    expenses: async () => {
      const expenses = await Expense.find().sort({ date: -1 }).lean();
      return transformDocuments(expenses);
    },

    expense: async (_: any, { id }: { id: string }) => {
      const expense = await Expense.findById(id).lean();
      if (!expense) return null;
      return transformDocument(expense);
    },

    expensesByCategory: async (_: any, { category }: { category: string }) => {
      const expenses = await Expense.find({ category })
        .sort({ date: -1 })
        .lean();
      return transformDocuments(expenses);
    },

    expensesByDateRange: async (
      _: any,
      { startDate, endDate }: { startDate: string; endDate: string }
    ) => {
      const expenses = await Expense.find({
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
        .sort({ date: -1 })
        .lean();
      return transformDocuments(expenses);
    },
  },

  Mutation: {
    createExpense: async (_: any, { input }: { input: any }) => {
      const expense = new Expense(input);
      await expense.save();
      return transformDocument(expense.toObject());
    },

    updateExpense: async (
      _: any,
      { id, input }: { id: string; input: any }
    ) => {
      const expense = await Expense.findByIdAndUpdate(id, input, {
        new: true,
      }).lean();
      if (!expense) return null;
      return transformDocument(expense);
    },

    deleteExpense: async (_: any, { id }: { id: string }) => {
      const result = await Expense.findByIdAndDelete(id);
      return !!result;
    },
  },
};
