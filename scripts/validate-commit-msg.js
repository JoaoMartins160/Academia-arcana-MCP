import { readFileSync } from "node:fs";

const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
	console.error("Error: Commit message file argument missing.");
	process.exit(1);
}

const commitMsg = readFileSync(commitMsgFile, "utf8").trim().split("\n")[0];

// Allow standard merge commits and tags
if (
	commitMsg.startsWith("Merge ") ||
	commitMsg.startsWith("Revert ") ||
	commitMsg.startsWith("Initial commit")
) {
	process.exit(0);
}

// Conventional Commits regex
const conventionalCommitRegex =
	/^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|wip)(\([a-zA-Z0-9_-]+\))?!?: .{1,100}$/;

if (!conventionalCommitRegex.test(commitMsg)) {
	console.error("\n❌ [Gitflow Rule 4] Mensagem de commit inválida!");
	console.error(`  Mensagem recebida: "${commitMsg}"\n`);
	console.error("  Formato exigido pelo Conventional Commits:");
	console.error("    <tipo>(<escopo>): <descrição curto em minúsculas>\n");
	console.error(
		"  Tipos válidos: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert, wip",
	);
	console.error("  Exemplos de escopos:");
	console.error(
		"    - Backend: api, db, models, handlers, middleware, config, tools, utils, foundry, character, combat",
	);
	console.error(
		"    - Frontend: ui, hooks, queries, router, store, components, types",
	);
	console.error(
		"  Exemplo válido: feat(handlers): adiciona handler de combates\n",
	);
	process.exit(1);
}

process.exit(0);
