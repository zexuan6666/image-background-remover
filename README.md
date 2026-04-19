# Image Background Remover

AI-powered background removal tool. Drop an image, get a transparent PNG.

## Tech Stack
- Next.js 14 (static export)
- TypeScript + Tailwind CSS
- Cloudflare Pages + Functions
- [remove.bg API](https://www.remove.bg/api)

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Cloudflare Pages

```bash
# Set your API key
npx wrangler pages secret put REMOVE_BG_API_KEY --project-name image-background-remover

# Build & deploy
npm run build
npx wrangler pages deploy out --project-name image-background-remover
```

## Features
- ✅ Drag & drop image upload
- ✅ AI background removal via remove.bg
- ✅ Before/after comparison
- ✅ Download transparent PNG
- ✅ Dark/light mode
- ✅ Responsive design
- ✅ SEO optimized
- ✅ Zero storage — pure memory processing
