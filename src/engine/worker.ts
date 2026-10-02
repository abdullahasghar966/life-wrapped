/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import { createEngine } from './api';
import { createBrowserDb } from './db/duckdb';

// Everything private happens in this worker: parsing, DuckDB and insight queries.
Comlink.expose(createEngine({ createDb: createBrowserDb }));
