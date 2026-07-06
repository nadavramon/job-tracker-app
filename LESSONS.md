# Lessons

Append-only, reverse-chronological. Each `/forge:retro` run records what to do better next time.
Recurring lessons graduate into constitution amendments or memory; the rest live here as the running record.

Entry format: `## <date> — retro: <feature>` → **Worked** / **Went wrong (+ root cause)** / **Lessons (routed: constitution | memory | log)**.

---

## 2026-07-06 — retro: 0001-refresh-token-hardening (scoped to the forge pipeline itself)

### Worked
- Phase-0 subagent fan-out (5 parallel single-angle reviewers) kept raw file reads out of the orchestrating session; all five returned file:line-specific findings, and three independently converged on the refresh-token subsystem — the convergence itself was signal.
- Both document reviewers earned their slots: `forge-spec-reviewer` caught two real spec defects (git-stash red→green impossible at verify time; try/catch ownership contradiction); `forge-plan-reviewer` caught a genuine build-breaker (missing Testcontainers artifacts).
- The deviation mechanism worked as designed: 4 deviations hit during implement, all logged in `## Deviations` at the moment they occurred, none silent.
- Executing the DoD literally (Article III/V) caught the highest-value finding of the run: `*IT` tests were silently skipped by `clean verify` (no failsafe plugin) — every per-test `-Dtest=` run had been green, giving a false sense of coverage.
- The adversarial verify reviewer caught a process gap no one else saw: the "frozen" spec/plan were untracked, so Article II wasn't literally satisfied.

### Went wrong (+ root cause)
- **Agent could not invoke any forge phase.** All five phase skills carry `disable-model-invocation: true`; root cause: forge assumes a human types each command, with no sanctioned path for user-directed agent execution. Worked around by hand-driving each SKILL.md.
- **Forge never commits its own artifacts.** specify writes spec.md and plan writes plan.md, but no step commits them; the "frozen" plan lived untracked until the adversarial reviewer flagged it. Root cause: pipeline defines artifact creation but not artifact persistence.
- **Plan-reviewer confidently "verified" a wrong runtime assumption.** It reasoned that test application.properties merges with main from a `@WebMvcTest` analogy; in reality same-named classpath resources shadow. Root cause: a document reviewer asserting runtime behavior from static reading — Article III (evidence before claims) wasn't applied to reviewer claims.
- **DoD template fought bug-fix specs.** "Prove behavior didn't change" is the wrong contract for a fix; red→green evidence also can't be re-derived at verify time once fixes are committed. Root cause: single DoD template shape for two different spec species.
- **Maven false green during TDD.** `-Dtest=SomeIT` runs an IT even when surefire's excludes would skip it in the phase-bound run — so per-task checks passed while `clean verify` never ran the ITs. Root cause: explicit `-Dtest` overrides surefire's default excludes.

### Lessons (routed)
1. Forge phases need a sanctioned agent-driven path → **claude-forge proposal P1** (README + SKILL.md note).
2. Approval gates should persist their artifacts → **claude-forge proposals P2/P3** (specify step 10, plan step 6 commit the artifact).
3. Spec template must distinguish bug-fix DoD (red→green captured at implement) from refactor DoD (suite unchanged) → **claude-forge proposal P4** (templates/spec.md).
4. Reviewers must label unexecuted runtime claims as assumptions, not verifications → **claude-forge proposal P5** (forge-plan-reviewer.md, forge-spec-reviewer.md).
5. Testcontainers 2.x artifact renames + test-properties shadowing + surefire/failsafe split → **project memory** (durable gotchas, already fixed in code).
6. Repo-local (not forge): `.claude/src/lib/tools/run-review-trigger.ts` is broken (MODULE_NOT_FOUND); review agents in `.claude/context/agents/*.md` aren't registered as spawnable subagent types → **log only**, fix in job-tracker-app when convenient.
