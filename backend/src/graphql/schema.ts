import { readFileSync } from 'fs';
import { join } from 'path';
import { gql } from 'graphql-tag';

const schemaPath = join(__dirname, 'schema.gql');
const typeDefs = gql(readFileSync(schemaPath, 'utf-8'));

export { typeDefs };
