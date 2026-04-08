# Environment Variables Setup

## Required Environment Variables

### Vercel Blob (for video uploads)
To handle video files larger than 4.5MB, you need Vercel Blob storage:

1. Go to your Vercel dashboard
2. Navigate to **Storage** → **Blob** → **Create**
3. Once created, Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables
4. For local development, run: `vercel env pull` to get `.env.local`

### AI Provider
```
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
# or
GOOGLE_AI_API_KEY=your_gemini_api_key_here
```

## Local Development
```bash
# Pull environment variables from Vercel
vercel env pull

# Or manually create .env.local with:
BLOB_READ_WRITE_TOKEN=your_token_here
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

## Production
When you connect your project to Vercel and enable Blob storage, the `BLOB_READ_WRITE_TOKEN` will be automatically provisioned.
