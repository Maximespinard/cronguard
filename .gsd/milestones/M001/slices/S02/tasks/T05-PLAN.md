---
estimated_steps: 1
estimated_files: 3
skills_used: []
---

# T05: Recovery alerts + integration tests

Wire recovery alerts into ping handler (down→up transition dispatches through configured channels). Integration tests covering miss detection → alert creation → dispatch. Structured logging for scheduler observability.

## Inputs

- `Ping handler state transition logic`
- `Alert dispatcher from T04`
- `Miss detector from T03`

## Expected Output

- `Recovery alert dispatch on down→up transition in ping handler`
- `Integration tests for full miss→alert→recovery pipeline`
- `Structured logging throughout scheduler`

## Verification

tsc --noEmit && npx eslint . && full test suite passes
