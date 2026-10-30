# Architecture

## Data flow

```text
Frankfurter (official daily FX references)       Licensed external feed (optional)
                   |                                         |
                   +------------------+----------------------+
                                      |
                         scripts/collect.mjs (Node 22)
                                      |
                     scripts/price-utils.mjs (validation)
                                      |
                       public/data/prices.json
                                      |
                         Vite build -> GitHub Pages
                                      |
                       React UI / Recharts (read only)
```

- `publish.yml`: `main` push, manual run, or JST hourly cron.
- Scheduled/manual jobs fetch prices and commit only when the series changes. This workflow also builds and deploys the dashboard, since bot-initiated commits do not trigger the normal `push` workflow.
- `ci.yml`: run node tests and TS/Vite build on `develop` pushes and pull requests.
- The browser never receives tokens; optional bearer credentials only exist in Actions Secrets.
- Public data is not sourced from Yahoo, unofficial scrapers, or APIs lacking clear republication rights.

## File contract

```json
{
  "version": 1,
  "updatedAt": "2026-10-30T01:17:00.000Z",
  "series": {
    "USDJPY": [{ "at": "2026-10-29T00:00:00.000Z", "value": 153.25 }]
  }
}
```

`updatedAt = null` and an empty `series` are valid before the first collection. Data points represent observations at their marked time; for reference rates the UTC midnight key means **provider reporting date**, not an intraday tick.

- At most one value per timestamp, latest write replaces a duplicate.
- Series sorted by UTC timestamp ascending.
- Nonpositive, NaN, infinite and unknown prices rejected.
- Retains the latest 180 days; older data is intentionally not kept.
- If a feed fails, successful other feeds can still update. If all fail, collection fails without altering the JSON.
- Workflows may run late or be skipped. Chart displays actual last observation rather than inventing a current price.

## Development

Implement changes on `develop`; open PRs targeting `main`. The hourly `schedule` trigger exists **only on the default branch**. Before merging a PR, run `npm test` and `npm run build` locally or use CI.
