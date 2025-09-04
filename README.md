# 🚀 AI Resume Generator

**Live Site**: https://www.resume-gen.app/

Transform your resume with AI to match any job description perfectly.

## 🎨 Current Status

### ✅ **Core Functionality - WORKING**
- AI resume generation with Gemini 1.5 Flash
- File upload and parsing (PDF/Word)
- Job description processing (URL or text)
- Enhanced prompts for format preservation

### ✅ **UI Design - COMPLETE & LIVE**
Beautiful modern design with:
- Purple-to-blue gradient background
- Glassmorphism cards with backdrop blur
- Mobile-first responsive layout
- Modern file upload interface
- Gradient buttons with hover effects

### 🔧 **Next Feature Request - PDF Preview**
**User Request**: PDF preview window with download options
- Replace HTML preview with embedded PDF viewer
- Show download buttons after preview interaction
- Offer both PDF and Word document formats

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

## 🚨 Next Steps for PDF Preview Implementation

1. **Install PDF viewer**: `npm install react-pdf` or implement PDF.js
2. **Create PDF generation API**: Immediate PDF creation after AI response
3. **Update ResumeDisplay component**: Embed PDF viewer instead of HTML
4. **Progressive download UI**: Show download options post-preview
5. **Maintain formatting**: Ensure PDF preserves original resume styling

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
