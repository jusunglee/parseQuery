# TypeScript SQL-like Query Engine

This project is a simple SQL-like query engine written in TypeScript. It demonstrates how to parse and execute basic SQL queries (SELECT, WHERE, ORDER BY) on an in-memory JavaScript object array, with logging and testability in mind.
Do not use this for real, it's merely a fun but inefficient and inextensive engine that I wanted to slowly continue and explore from a fun open ended interview question I got.s

## Features

- Parse and execute queries like:
  - `SELECT title, author FROM library WHERE year = 2006 ORDER BY author,title`
- Supports `WHERE` clauses with `=`, `<`, `>` operators
- Supports `ORDER BY` on one or more columns
- Type-safe column selection and result typing
- Logging with configurable log level (`info` or `debug`)
- Easily extensible for more SQL features

## Usage

### Install dependencies

```bash
npm install
```

### Run the code

```bash
npm run dev -- --logLevel=debug
```

- The `--logLevel` flag is optional. Use `info` (default) or `debug` for more verbose output.

### Format the code

```bash
npm run format
```

## Project Structure

- `main.ts` - Main entry point, query parsing, and test runner
- `types.ts` - TypeScript types for Book and Logger
- `logger.ts` - Winston logger setup
- `database.ts` - In-memory database (library)

## Example Query

```sql
SELECT title, author FROM library WHERE year = 2006 ORDER BY author,title
```

## Extending

- Add more SQL features by extending the parser and evaluator functions in `main.ts`.
- Add more tables or data in `database.ts`.

## License

MIT
