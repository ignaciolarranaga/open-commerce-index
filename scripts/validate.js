#!/usr/bin/env node
/** Validates data/categories.json and every manifest under data/stores/. Exit code 1 on any problem. */
import { validateAll } from './lib/validate.js';

const { problems, stores } = validateAll();
if (problems.length) {
  for (const problem of problems) console.error(`✖ ${problem.file}: ${problem.message}`);
  console.error(`\n${problems.length} problem(s) in ${stores.length} store(s).`);
  process.exit(1);
}
console.log(`✔ ${stores.length} store manifest(s) and the taxonomy are valid.`);
