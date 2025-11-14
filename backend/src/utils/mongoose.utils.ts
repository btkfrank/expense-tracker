import { Types } from 'mongoose';

// Generic function to transform a single Mongoose document
export function transformDocument<T extends Record<string, any>>(
  doc: T
): Omit<T, '__v' | '_id'> & { id: string } {
  const { __v, _id, ...docWithoutIdAndVersion } = doc;
  return {
    id: _id.toString(),
    ...docWithoutIdAndVersion,
  } as Omit<T, '__v' | '_id'> & { id: string };
}

// Generic function to transform an array of Mongoose documents
export function transformDocuments<T extends Record<string, any>>(
  docs: T[]
): (Omit<T, '__v' | '_id'> & { id: string })[] {
  return docs.map(transformDocument);
}

// Generic function to transform Mongoose query results (handles both single and array)
export function transformQueryResult<T extends Record<string, any>>(
  result: T | T[]
):
  | (Omit<T, '__v' | '_id'> & { id: string })
  | (Omit<T, '__v' | '_id'> & { id: string })[] {
  return Array.isArray(result)
    ? transformDocuments(result)
    : transformDocument(result);
}
