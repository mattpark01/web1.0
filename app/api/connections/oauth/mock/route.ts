import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const integration = searchParams.get('integration')
  const installation = searchParams.get('installation')
  
  // Mock OAuth success page
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OAuth Mock - ${integration}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 400px;
          }
          h1 {
            color: #1a202c;
            margin-bottom: 1rem;
          }
          p {
            color: #4a5568;
            margin-bottom: 1.5rem;
          }
          .success {
            color: #48bb78;
            font-size: 3rem;
            margin-bottom: 1rem;
          }
          button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover {
            background: #5a67d8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>Authorization Successful!</h1>
          <p>
            ${integration ? integration.charAt(0).toUpperCase() + integration.slice(1).replace('-', ' ') : 'Integration'} 
            has been connected to your account.
          </p>
          <button onclick="window.close()">Close Window</button>
          <script>
            // Send message to parent window
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth-success',
                integration: '${integration}',
                installation: '${installation}'
              }, '*');
              setTimeout(() => window.close(), 2000);
            }
          </script>
        </div>
      </body>
    </html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}