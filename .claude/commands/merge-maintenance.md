Find and merge open maintenance PRs in this repository.

1. Run `gh pr list --repo Artificial-EQ/WellSaid --json number,title,author,statusCheckRollup` to get open PRs with their CI status.

2. Filter to maintenance PRs: Dependabot PRs (author login contains "dependabot") and any PR whose title starts with "chore:", "build:", or "fix(deps)".

3. For each candidate PR:
   - Skip it if CI checks are failing or still in progress — report it as skipped and why.
   - If CI is passing (or there are no checks), merge it with `gh pr merge <number> --repo Artificial-EQ/WellSaid --merge --delete-branch`.

4. Report a summary: which PRs were merged, which were skipped and why, and whether any need attention.

If there are no open maintenance PRs, say so.
