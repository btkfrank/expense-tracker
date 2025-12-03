import { ChatOpenAI } from '@langchain/openai';
import {
  AIMessage,
  HumanMessage,
  MessageStructure,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import Expense from '../../models/Expense';
import { tools, toolsByName } from './expenseTools';

const DEFAULT_MODEL = 'gpt-4o-mini';
const TEMPERATURE = 0;

const systemPrompt = `You are an assistant for the Expense Tracker application.
You help users answer questions about their spending, budgeting trends,
and historical expense behavior. If you lack enough context to answer,
respond politely asking for clarification. Keep responses concise.`;

export async function askExpenseAgent(question: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is missing. Please add it to your environment variables.'
    );
  }

  const chatModel = new ChatOpenAI({
    model: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    temperature: TEMPERATURE,
    apiKey: process.env.OPENAI_API_KEY,
  });
  // Bind tools so the model can fetch only what it needs.
  const toolModel = chatModel.bindTools(tools);

  const messages: (
    | SystemMessage<MessageStructure>
    | HumanMessage<MessageStructure>
    | ToolMessage<MessageStructure>
    | AIMessage<MessageStructure>
  )[] = [
    new SystemMessage(
      systemPrompt +
        '\n\nYou have tools to query expenses. Use them to gather data before answering. ' +
        'Ask for clarification if the question is ambiguous.'
    ),
    new HumanMessage(question),
  ];

  // Simple tool-calling loop (max 3 rounds)
  for (let i = 0; i < 3; i++) {
    const ai = await toolModel.invoke(messages as any);

    const toolCalls: Array<{ id: string; name: string; args: any }> =
      (ai as any)?.tool_calls ?? [];

    if (toolCalls.length === 0) {
      const content = (ai as any)?.content;
      return (content ?? '').toString().trim();
    }

    // Important: include the assistant message that contains tool_calls
    messages.push(ai as AIMessage<MessageStructure>);

    for (const call of toolCalls) {
      const selectedTool = toolsByName[call.name];
      if (!selectedTool) {
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: `Tool "${call.name}" not found`,
          })
        );
        continue;
      }
      try {
        const args =
          typeof (call as any).args === 'string'
            ? JSON.parse((call as any).args)
            : (call as any).args;

        const result = await (selectedTool as any).invoke(args);
        console.log('------------------------------------result', result);
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: JSON.stringify(result),
          })
        );
      } catch (err: any) {
        messages.push(
          new ToolMessage({
            tool_call_id: call.id,
            content: `Tool execution error: ${err?.message ?? String(err)}`,
          })
        );
      }
    }
  }

  return 'I could not complete that. Please rephrase or narrow the question.';
}

async function buildExpenseContext(days = 90) {
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
    .limit(5)
    .select('date amount category description')
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
    recentExpenses: recent.map((e: any) => ({
      date: e.date,
      amount: e.amount,
      category: e.category,
      description: e.description,
    })),
  };
}
