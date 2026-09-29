# Deployment

Production is deployed to Vercel by `.github/workflows/deploy.yml` on every push to `master`, after the full test suite passes. Pull-request previews come from Vercel's GitHub integration.

## Credentials

| Name                                                                                         | Where                                     | Purpose                                                    |
| -------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `VERCEL_TOKEN`                                                                               | GitHub secret                             | Authenticates the Vercel CLI. Without it the deploy is skipped. |
| `VERCEL_ORG_ID`                                                                              | GitHub secret                             | Vercel team or account ID.                                 |
| `VERCEL_PROJECT_ID`                                                                          | GitHub secret                             | Vercel project ID.                                         |
| `RESEND_API_KEY`                                                                             | Vercel env (Production and Preview)       | Sends contact-form e-mail.                                 |
| `CONTACT_TO_EMAIL`                                                                           | Vercel env (Production and Preview)       | Recipient of contact messages.                             |
| `CONTACT_FROM_EMAIL`                                                                         | Vercel env (Production and Preview)       | Sender address on a Resend-verified domain.                |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`                                                            | Vercel env (optional)                     | Google Maps key.                                           |

The remaining variables are listed in `.env.example`; set `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_BUSINESS_LAT` and `NEXT_PUBLIC_BUSINESS_LNG` in Vercel too. Never set `ENABLE_TEST_ENDPOINTS` in Vercel.

## Setup

1. Import the GitHub repository in Vercel (Add New, Project). The framework is detected as Next.js.
2. Run `npx vercel link` locally and read `.vercel/project.json` for `orgId` and `projectId`.
3. Create a token at vercel.com/account/tokens. In GitHub, go to Settings, Secrets and variables, Actions, and add `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`.
4. In Vercel, go to Project Settings, Environment Variables, and add the variables above for Production and Preview.
5. In Resend, verify the domain used in `CONTACT_FROM_EMAIL` (add the DNS records Resend shows).
6. In Vercel, go to Project Settings, Domains, add the custom domain and create the DNS records Vercel shows at your registrar.
7. Re-run the Deploy workflow (Actions, Deploy, Run workflow) or push to `master`.

## How deploys work

- **Production:** a push to `master` runs the `test` job (`npm run test:ai`), then the `deploy` job runs `vercel pull`, `vercel build --prod` and `vercel deploy --prebuilt --prod`. The URL appears in the job summary. Runs are serialized (`concurrency: deploy-production`) and never cancelled midway. Until `VERCEL_TOKEN` is set the deploy job skips its steps and the workflow stays green.
- **Previews:** Vercel's GitHub integration deploys every pull request and comments the preview URL. No workflow runs pull-request code with secrets.
- **No duplicate production deploys:** `vercel.json` disables Git-triggered deployments of `master`, so production only ships through the gated workflow.

## Rollback

- In Vercel, open Deployments, pick an earlier production deployment and choose Promote to Production (instant, no rebuild).
- Or `git revert` the offending commit and push to `master`; the workflow redeploys.
