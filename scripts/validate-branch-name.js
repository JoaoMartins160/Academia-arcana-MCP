import { execSync } from "node:child_process";

let branchName = "";
try {
	branchName = execSync("git rev-parse --abbrev-ref HEAD", {
		encoding: "utf8",
	}).trim();
} catch (e) {
	process.exit(0);
}

// Ignore detached HEAD or default branches
if (
	!branchName ||
	branchName === "HEAD" ||
	branchName === "main" ||
	branchName === "development"
) {
	process.exit(0);
}

// Patterns from Gitflow SKILL.md
const featurePattern = /^feature\/DES-\d+-[a-z0-9-]+$/;
const releasePattern = /^release\/v\d+\.\d+\.\d+$/;
const hotfixPattern = /^hotfix\/v\d+\.\d+\.\d+$/;

const isValid =
	featurePattern.test(branchName) ||
	releasePattern.test(branchName) ||
	hotfixPattern.test(branchName);

if (!isValid) {
	console.error("\n❌ [Gitflow Rule 2] Nome de branch inválido!");
	console.error(`  Branch atual: "${branchName}"\n`);
	console.error(
		"  As branches devem seguir os padrões de nomenclatura estrita do Gitflow:",
	);
	console.error(
		"    - Feature:  feature/DES-<ID>-<nome-curto> (ex: feature/DES-101-login)",
	);
	console.error(
		"    - Release:  release/v<MAJOR>.<MINOR>.<PATCH> (ex: release/v1.0.0)",
	);
	console.error(
		"    - Hotfix:   hotfix/v<MAJOR>.<MINOR>.<PATCH> (ex: hotfix/v1.0.1)",
	);
	console.error("    - Permanentes: main, development\n");
	process.exit(1);
}

process.exit(0);
