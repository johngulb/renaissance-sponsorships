import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { DefaultSeo, NextSeo } from "next-seo";
import { StyleSheetManager } from "styled-components";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UserProvider } from "@/contexts/UserContext";
import { GlobalStyle } from "@/styles/globalStyles";

export default function App({ Component, pageProps }: AppProps) {
  const { metadata } = pageProps;
  return (
    <ThemeProvider>
      <UserProvider>
        <StyleSheetManager shouldForwardProp={(prop) => !prop.startsWith('$')}>
          <GlobalStyle />
          <DefaultSeo
            titleTemplate="%s | Renaissance App"
            defaultTitle="Renaissance App"
            description="A Renaissance mini app"
            openGraph={{
              images: [
                {
                  url: '/thumbnail.jpg',
                  width: 1200,
                  height: 630,
                  alt: 'Renaissance App',
                },
              ],
            }}
          />
          {metadata && <NextSeo {...metadata} />}
          <Component {...pageProps} />
        </StyleSheetManager>
      </UserProvider>
    </ThemeProvider>
  );
}
