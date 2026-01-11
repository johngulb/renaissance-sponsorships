import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.builddetroit.xyz';
    
    return (
      <Html lang="en">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&family=Inter:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
          <link rel="icon" href="/favicon.ico" />
          
          {/* Farcaster Mini App Identification */}
          <meta name="application-name" content="Renaissance App" />
          <meta name="apple-mobile-web-app-title" content="Renaissance App" />
          <link rel="manifest" href={`${appUrl}/.well-known/farcaster.json`} />
          
          {/* Open Graph / Social Media Meta Tags */}
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Renaissance App" />
          <meta property="og:image" content={`${appUrl}/thumbnail.jpg`} />
          
          {/* Twitter Card Meta Tags */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Renaissance App" />
          <meta name="twitter:description" content="A Renaissance mini app" />
          <meta name="twitter:image" content={`${appUrl}/thumbnail.jpg`} />
        </Head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Early SDK detection - runs before React loads
                // Supports multiple SDK injection methods per Farcaster Mini App spec
                (function() {
                  console.log('🔍 Early SDK detection starting...');
                  
                  // Store SDK reference globally for React to access
                  window.__FARCASTER_SDK__ = null;
                  window.__FARCASTER_USER__ = null;
                  
                  async function checkForSDK() {
                    const win = window;
                    
                    // Method 1: Check window.farcaster (RPC method)
                    if (win.farcaster) {
                      console.log('✅ Found window.farcaster');
                      window.__FARCASTER_SDK__ = win.farcaster;
                      
                      if (win.farcaster.context) {
                        try {
                          const context = await win.farcaster.context;
                          if (context && context.user && context.user.fid > 0) {
                            window.__FARCASTER_USER__ = context.user;
                            console.log('✅ User found via window.farcaster.context:', context.user);
                            window.dispatchEvent(new CustomEvent('farcaster:user', { detail: context.user }));
                          }
                        } catch (e) {
                          console.log('⚠️ Error accessing farcaster.context:', e);
                        }
                      }
                    }
                    
                    // Method 2: Check window.__renaissanceAuthContext (direct access)
                    if (win.__renaissanceAuthContext) {
                      console.log('✅ Found window.__renaissanceAuthContext');
                      const context = win.__renaissanceAuthContext;
                      if (context && context.user && context.user.fid > 0) {
                        window.__FARCASTER_USER__ = context.user;
                        console.log('✅ User found via __renaissanceAuthContext:', context.user);
                        window.dispatchEvent(new CustomEvent('farcaster:user', { detail: context.user }));
                      }
                    }
                    
                    // Method 3: Check window.getRenaissanceAuth() function
                    if (typeof win.getRenaissanceAuth === 'function') {
                      console.log('✅ Found window.getRenaissanceAuth()');
                      try {
                        const context = win.getRenaissanceAuth();
                        if (context && context.user && context.user.fid > 0) {
                          window.__FARCASTER_USER__ = context.user;
                          console.log('✅ User found via getRenaissanceAuth():', context.user);
                          window.dispatchEvent(new CustomEvent('farcaster:user', { detail: context.user }));
                        }
                      } catch (e) {
                        console.log('⚠️ Error calling getRenaissanceAuth():', e);
                      }
                    }
                    
                    // Fallback: Check other SDK locations
                    const sdk = win.FarcasterSDK || win.sdk;
                    if (sdk) {
                      console.log('✅ Found SDK in fallback location');
                      window.__FARCASTER_SDK__ = sdk;
                      
                      if (sdk.context && sdk.context.user) {
                        window.__FARCASTER_USER__ = sdk.context.user;
                        console.log('✅ User found in fallback SDK:', sdk.context.user);
                        window.dispatchEvent(new CustomEvent('farcaster:user', { detail: sdk.context.user }));
                      }
                    }
                  }
                  
                  // Check immediately
                  checkForSDK();
                  
                  // Check after DOM loads
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      checkForSDK();
                    });
                  }
                  
                  // Check after window loads
                  window.addEventListener('load', function() {
                    checkForSDK();
                  });
                  
                  // Listen for farcaster:context:ready event
                  window.addEventListener('farcaster:context:ready', function(event) {
                    console.log('📨 Received farcaster:context:ready event:', event);
                    const detail = event.detail;
                    if (detail && detail.user && detail.user.fid > 0) {
                      window.__FARCASTER_USER__ = detail.user;
                      console.log('✅ User found via farcaster:context:ready event:', detail.user);
                      window.dispatchEvent(new CustomEvent('farcaster:user', { detail: detail.user }));
                    }
                  });
                  
                  // Poll periodically - iOS app may inject SDK after page load
                  let pollCount = 0;
                  const pollInterval = setInterval(function() {
                    pollCount++;
                    checkForSDK();
                    
                    if (pollCount > 20) {
                      clearInterval(pollInterval);
                      console.log('⏱️ Early detection polling complete');
                    }
                  }, 500);
                  
                  // Listen for postMessage from iOS app
                  window.addEventListener('message', function(event) {
                    console.log('📨 Received postMessage in early detection:', event.data);
                    if (event.data && event.data.type === 'farcaster' && event.data.user) {
                      window.__FARCASTER_USER__ = event.data.user;
                      console.log('✅ User received via postMessage:', event.data.user);
                      window.dispatchEvent(new CustomEvent('farcaster:user', { detail: event.data.user }));
                    }
                  });
                  
                  // Try to call ready() early
                  async function tryCallReady() {
                    try {
                      const win = window;
                      
                      if (win.farcaster) {
                        try {
                          const result = await win.farcaster.actions?.ready?.();
                          console.log('✅ [Early] Called window.farcaster.actions.ready()');
                          window.__FARCASTER_READY_CALLED__ = true;
                          return;
                        } catch (e1) {
                          try {
                            const actions = win.farcaster.actions;
                            if (actions) {
                              await actions.ready();
                              console.log('✅ [Early] Called actions.ready()');
                              window.__FARCASTER_READY_CALLED__ = true;
                              return;
                            }
                          } catch (e2) {
                            console.log('⚠️ [Early] ready() methods failed');
                          }
                        }
                      }
                    } catch (e) {
                      console.log('⚠️ [Early] Error in tryCallReady():', e);
                    }
                  }
                  
                  // Try calling ready() after a delay
                  const pathname = window.location.pathname;
                  if (pathname === '/' || pathname === '/dashboard') {
                    setTimeout(tryCallReady, 100);
                    setTimeout(tryCallReady, 500);
                    setTimeout(tryCallReady, 1000);
                  }
                })();
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
