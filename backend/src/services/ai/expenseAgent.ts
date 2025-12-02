import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

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

  // MUST be awaited
  const prompt = await PromptTemplate.fromTemplate(
    `{systemPrompt}\n\nUser question:\n{question}\n\nAssistant response:`
  );

  // MUST also be awaited (v1.1.x)
  const partialPrompt = await prompt.partial({ systemPrompt });

  const chatModel = new ChatOpenAI({
    modelName: process.env.OPENAI_MODEL ?? DEFAULT_MODEL,
    temperature: TEMPERATURE,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const chain = RunnableSequence.from([
    partialPrompt, // now a real Runnable
    chatModel,
    new StringOutputParser(),
  ]);

  const response = await chain.invoke({ question });
  return response.trim();
}
