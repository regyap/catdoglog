# Pawprint

Responsive neighbourhood cat-and-dog discovery, capture, care, and walking MVP.

## Streamlit edition

```bash
python -m pip install -r requirements-streamlit.txt
streamlit run streamlit/app.py
```

Open `http://localhost:8501`. The Streamlit edition includes the main dashboard, map, camera capture, match review, walking, journal, admin preview, and secure-login presentation.

The Capture page also performs local cat-breed estimation with a ViT model fine-tuned on Oxford-IIIT Pets. The first analysis downloads and caches the model weights. Predictions cover 12 cat breeds and are presented as uncertain visual estimates, never pedigree or veterinary claims.

## Local development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The health endpoint is `GET /api/health`.

## Production container

Start Docker Desktop, then run:

```bash
docker compose up --build -d
docker compose ps
```

Open `http://localhost:3000`. To use another host port, set `PAWPRINT_PORT`, for example `$env:PAWPRINT_PORT=8080` in PowerShell. Stop with `docker compose down`.

The image is multi-stage, runs as a non-root user, drops Linux capabilities, uses a read-only filesystem, and exposes a container health check.

## CI/CD

- `ci.yml`: lint, production build, standalone smoke test, Docker build, and container health test.
- `publish-container.yml`: publishes signed build metadata and an SBOM to GitHub Container Registry on semantic-version tags or manual runs.
- `deploy-vercel.yml`: manually deploys a preview or production build using a prebuilt Vercel artifact.

For Vercel deployment, add repository secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`. Never commit them.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
