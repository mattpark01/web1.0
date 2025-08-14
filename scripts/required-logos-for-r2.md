# Required Logos for R2 Bucket

## Complete List of Integration Logos Needed

Based on our marketplace integrations, we need the following logos in the R2 bucket at:
`https://capability-assets.b2d3a589f17a3b00cd21a8bea1d72f09.r2.cloudflarestorage.com/png/`

### Unique Logos Required (24 total)

1. **airtable.png** - Airtable
2. **alpaca.png** - Alpaca Markets
3. **alpha-vantage.png** - Alpha Vantage
4. **calendly.png** - Calendly
5. **coinbase.png** - Coinbase
6. **dropbox.png** - Dropbox
7. **github.png** - GitHub (used by github, github-gists, github-issues)
8. **gitlab.png** - GitLab
9. **gmail.png** - Gmail
10. **google-calendar.png** - Google Calendar
11. **google-drive.png** - Google Drive
12. **google-sheets.png** - Google Sheets
13. **google-tasks.png** - Google Tasks
14. **microsoft-todo.png** - Microsoft To Do
15. **mx.png** - MX Technologies
16. **outlook.png** - Microsoft Outlook (used by outlook-calendar, outlook-mail)
17. **plaid.png** - Plaid
18. **polygon.png** - Polygon.io
19. **robinhood.png** - Robinhood
20. **vercel.png** - Vercel
21. **yodlee.png** - Yodlee/Envestnet

### Consolidated Logo Mapping

Some integrations share logos:
- **github.png** → Used by: `github`, `github-gists`, `github-issues`
- **outlook.png** → Used by: `outlook-calendar`, `outlook-mail`

### Current Status

We are currently using public CDN URLs as a temporary solution:
- ✅ All integrations have working logo URLs from public CDNs
- ⏳ Need to upload these logos to R2 bucket for better control and consistency

### Upload Checklist

To upload to R2 bucket:

```bash
# Example structure in R2 bucket
/png/
├── airtable.png
├── alpaca.png
├── alpha-vantage.png
├── calendly.png
├── coinbase.png
├── dropbox.png
├── github.png
├── gitlab.png
├── gmail.png
├── google-calendar.png
├── google-drive.png
├── google-sheets.png
├── google-tasks.png
├── microsoft-todo.png
├── mx.png
├── outlook.png
├── plaid.png
├── polygon.png
├── robinhood.png
├── vercel.png
└── yodlee.png
```

### Recommended Logo Specifications

- **Format**: PNG with transparent background
- **Size**: 256x256px or 512x512px
- **Quality**: High resolution, optimized for web
- **File size**: Under 100KB per logo

### How to Enable R2 Logos

Once logos are uploaded to R2:

1. Set environment variable:
   ```bash
   NEXT_PUBLIC_R2_BUCKET_URL=https://capability-assets.b2d3a589f17a3b00cd21a8bea1d72f09.r2.cloudflarestorage.com
   ```

2. Update the code in `/app/api/marketplace/integrations/route.ts`:
   ```typescript
   const USE_R2 = true // Change from false to true
   ```

3. The system will automatically use R2 logos instead of public CDN URLs