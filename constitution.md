# Constitution

Project principles the forge pipeline reads at every phase. Amend via `/forge:retro` proposals only.

## Article I — Intent before implementation
State the "what" and "why" before any "how". Human articulates intent; Claude articulates decomposition; agreement before code.

## Article II — Approve gate
No code before a frozen, explicitly APPROVEd plan. Post-approval plan changes are deviations and must be logged, never silent.

## Article III — Evidence before claims
Every completion claim includes fresh command output. Banned without immediately preceding evidence: "should work", "looks correct", "Done!", "tests are passing", "verified". Run the command, paste the output, then claim.

## Article IV — Own it end-to-end
Every feature ships with: error handling, a test, and one sentence answering "how do we know this works in prod".

## Article V — Verification mirrors CI
The Definition of Done runs the full check gauntlet the CI runs (lint + typecheck + test), never a hand-picked subset.

## Article VI — Human decides, AI proposes
Claude never approves its own plan, merge, or deploy. Those are the human's checkpoints.

## Project amendments

<!-- /forge:retro proposals land here after approval. -->
