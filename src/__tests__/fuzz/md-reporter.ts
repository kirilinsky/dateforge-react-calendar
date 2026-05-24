import fs from "node:fs";
import path from "node:path";
import type { TestCase, TestModule } from "vitest/node";
import type { Reporter } from "vitest/reporters";

type FailureEntry = {
  file: string;
  suite: string;
  name: string;
  message: string;
  stack: string;
};

function isFuzzFile(filePath: string): boolean {
  return (
    filePath.includes("__tests__/fuzz") || filePath.includes("__tests__\\fuzz")
  );
}

function* walkTests(module: TestModule): Generator<TestCase> {
  for (const child of module.children.array()) {
    if (child.type === "test") {
      yield child;
    } else {
      for (const t of child.children.array()) {
        if (t.type === "test") yield t;
      }
    }
  }
}

export default class FuzzMdReporter implements Reporter {
  private failures: FailureEntry[] = [];

  onTestCaseResult(testCase: TestCase): void {
    const result = testCase.result();
    if (result.state !== "failed") return;
    if (!isFuzzFile(testCase.module.moduleId)) return;

    const suite =
      testCase.parent.type === "suite" ? testCase.parent.name : "(root)";

    for (const err of result.errors ?? []) {
      this.failures.push({
        file: testCase.module.moduleId,
        suite,
        name: testCase.name,
        message: err.message ?? "(no message)",
        stack: err.stack ?? "",
      });
    }
  }

  onTestRunEnd(testModules: ReadonlyArray<TestModule>): void {
    // Also sweep modules in case onTestCaseResult was not called
    for (const mod of testModules) {
      if (!isFuzzFile(mod.moduleId)) continue;
      for (const tc of walkTests(mod)) {
        const result = tc.result();
        if (result.state !== "failed") continue;
        const suite = tc.parent.type === "suite" ? tc.parent.name : "(root)";
        const alreadyCaptured = this.failures.some(
          (f) => f.file === mod.moduleId && f.name === tc.name,
        );
        if (alreadyCaptured) continue;
        for (const err of result.errors ?? []) {
          this.failures.push({
            file: mod.moduleId,
            suite,
            name: tc.name,
            message: err.message ?? "(no message)",
            stack: err.stack ?? "",
          });
        }
      }
    }

    if (this.failures.length === 0) return;

    const reportPath = path.resolve(process.cwd(), ".notes/fuzz-report.md");
    const date = new Date().toISOString().slice(0, 19).replace("T", " ");

    const lines: string[] = [
      "# Fuzz Report",
      "",
      `Generated: ${date}  `,
      `Failures: ${this.failures.length}`,
      "",
    ];

    for (const f of this.failures) {
      lines.push(`## ${f.suite} › ${f.name}`);
      lines.push("");
      lines.push(`**File:** \`${f.file}\``);
      lines.push("");
      lines.push(
        "**Error message** (includes fast-check seed + counterexample):",
      );
      lines.push("");
      lines.push("```");
      lines.push(f.message);
      lines.push("```");
      lines.push("");
      if (f.stack) {
        lines.push("<details><summary>Stack trace</summary>");
        lines.push("");
        lines.push("```");
        lines.push(f.stack.slice(0, 3000));
        lines.push("```");
        lines.push("");
        lines.push("</details>");
        lines.push("");
      }
    }

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, lines.join("\n"), "utf-8");
  }
}
