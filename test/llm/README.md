# lumagl Agent Skill Evaluation

`lumagl-skill-evals.json` is an offline corpus for manually comparing agent behavior with
and without the `lumagl` skill. CI does not invoke a model, grade responses, or require
model API credentials.

## Validate the corpus

From the repository root, run:

```bash
yarn test-node test/llm/lumagl-skill.node.spec.ts
```

This checks the skill frontmatter and references, corpus structure, unique case IDs,
expected categories, and canonical source paths. A passing test means that those static
checks succeeded; it does not mean that the behavioral cases passed. The same test also
runs as part of the full `yarn test-node` and `yarn test` suites.

## Compare agent behavior manually

1. Record the repository commit, model and agent versions, date, tool permissions,
   settings, and number of trials per case.
2. Use clean, equivalent workspaces and fresh sessions for every trial. Keep the model,
   prompt, context, tools, and settings identical between runs.
3. For the baseline, ensure that no luma.gl skill is installed or discoverable. For the
   treatment, load `skills/lumagl` from the same checkout through the runner's local-skill
   mechanism, and record that mechanism with the results.
4. Run the exact case prompt once in each workspace. Do not give the agent the scoring
   criteria or canonical sources.
5. Preserve the transcript, tool output, logs, and visual artifacts needed to verify the
   response.
6. Score each run from the preserved evidence. Repeat with the same trial count for every
   case when more than one trial is used.

For each run, count the expected behaviors that are clearly supported by evidence and
the forbidden mistakes that occurred. Unclear or unsupported behavior does not count as
satisfied. A case passes only when every expected behavior is satisfied and no forbidden
mistake occurs. Use `canonicalSources` to judge technical correctness; citing every source
is not itself required unless a criterion says so.

## Share results

Include the run metadata above and a table like this in the pull request or linked result
artifact:

| Case | Baseline expected | Baseline forbidden | Baseline pass | With skill expected | With skill forbidden | With skill pass | Evidence |
| --- | ---: | ---: | --- | ---: | ---: | --- | --- |
| `case-id` | 2/4 | 1 | No | 4/4 | 0 | Yes | Transcript and artifact links |

Report the baseline and with-skill pass totals separately. Do not describe the behavioral
corpus as passing based only on the static validation command.
