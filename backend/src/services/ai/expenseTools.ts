import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import Expense from '../../models/Expense';

export const getSummaryTool = tool(
  async ({ days }: { days: number }) => {
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [summary] = await Expense.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
    ]);

    const recent = await Expense.find({ date: { $gte: since } })
      .sort({ date: -1 })
      .limit(10)
      .select('date amount category description tags')
      .lean();

    return {
      range: { since: since.toISOString(), until: now.toISOString() },
      summary: {
        totalAmount: summary?.totalAmount ?? 0,
        count: summary?.count ?? 0,
        avgAmount: summary?.count
          ? (summary.totalAmount as number) / (summary.count as number)
          : 0,
      },
      byCategory: byCategory.map((c: any) => ({
        category: c._id,
        totalAmount: c.totalAmount,
        count: c.count,
      })),
      recentExpenses: recent,
    };
  },
  {
    name: 'get_summary',
    description:
      'Get spending summary, top categories, and recent expenses for a time window (days).',
    schema: z.object({ days: z.number().int().min(1).max(3650).default(90) }),
  }
);

export const queryExpensesTool = tool(
  async ({
    q,
    category,
    min,
    max,
    since,
    until,
    limit,
  }: {
    q?: string;
    category?: string;
    min?: number;
    max?: number;
    since?: string;
    until?: string;
    limit?: number;
  }) => {
    const filter: any = {};
    if (category) filter.category = category;
    if (min != null || max != null) {
      filter.amount = {};
      if (min != null) filter.amount.$gte = min;
      if (max != null) filter.amount.$lte = max;
    }
    if (since || until) {
      filter.date = {};
      if (since) filter.date.$gte = new Date(since);
      if (until) filter.date.$lte = new Date(until);
    }
    if (q) {
      const rx = new RegExp(q, 'i');
      filter.$or = [{ description: rx }, { tags: rx }];
    }

    const items = await Expense.find(filter)
      .sort({ date: -1 })
      .limit(limit as number)
      .select('date amount category description tags')
      .lean();

    return { count: items.length, items };
  },
  {
    name: 'query_expenses',
    description:
      'Search expenses by free-text, category, amount range, and date range. Returns recent matches.',
    schema: z.object({
      q: z.string().optional(),
      category: z.string().optional(),
      min: z.number().optional(),
      max: z.number().optional(),
      since: z.string().datetime().optional(),
      until: z.string().datetime().optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }),
  }
);

export const trendByMonthTool = tool(
  async ({ months }: { months: number }) => {
    const now = new Date();
    const since = new Date(now);
    since.setMonth(since.getMonth() - months + 1);

    const rows = await Expense.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]);

    return rows.map((r: any) => {
      const y = r._id.y;
      const m = String(r._id.m).padStart(2, '0');
      return { month: `${y}-${m}`, totalAmount: r.totalAmount, count: r.count };
    });
  },
  {
    name: 'trend_by_month',
    description:
      'Monthly totals for the last N months. Useful for trend and seasonality questions.',
    schema: z.object({ months: z.number().int().min(1).max(60).default(12) }),
  }
);

export const tools = [getSummaryTool, queryExpensesTool, trendByMonthTool];
export const toolsByName = Object.fromEntries(tools.map((t) => [t.name, t]));
