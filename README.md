# 🚀 AI Resume Generator

**Live Site**: https://www.resume-gen.app/

Transform your resume with AI to match any job description perfectly.

## 🎨 Current Status

### ✅ **UI Design - COMPLETE & LIVE**
Beautiful modern design with:
- Purple-to-blue gradient background
- Glassmorphism cards with backdrop blur
- Mobile-first responsive layout
- Modern file upload interface
- Gradient buttons with hover effects

### ❌ **API Functionality - NEEDS DEBUGGING**
Current issue: 500 Internal Server Error
- Environment variables may not be set in Vercel
- Test endpoint available at `/api/test`

## 🔧 Quick Setup

### Local Development
```bash
npm install
npm run dev
```

### Environment Variables
```bash
# .env.local
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Vercel Deployment
1. Connect GitHub repository
2. Add environment variable: `GOOGLE_GEMINI_API_KEY`
3. Deploy

## 🚨 Next Steps to Fix

1. **Check environment variables**: Visit `/api/test` endpoint
2. **Add missing env vars** to Vercel dashboard if needed
3. **Test with plain text** job descriptions (not URLs)
4. **Debug specific errors** with enhanced logging

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5.2, TypeScript, Tailwind CSS
- **AI**: Google Gemini API
- **Scraping**: Puppeteer + Chromium
- **Documents**: PDF parsing, Word generation
- **Hosting**: Vercel
- **Domain**: resume-gen.app

## 📁 Key Files

- `src/app/page.tsx` - Main UI with gradient design
- `src/app/api/generate-resume/route.ts` - AI processing endpoint
- `src/components/ResumeDisplay.tsx` - Results display
- `src/app/api/test/route.ts` - Debug endpoint

---

*Beautiful UI is complete and live. API functionality needs environment variable configuration in Vercel.*
