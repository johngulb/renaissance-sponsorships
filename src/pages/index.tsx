import React, { useEffect } from "react";
import Splash from "@/components/Splash";
import { useUser } from "@/contexts/UserContext";

// App configuration - customize these values for your mini app
const APP_NAME = "App";

export const getServerSideProps = async () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.builddetroit.xyz';
  
  return {
    props: {
      metadata: {
        title: `${APP_NAME} - Renaissance Mini App`,
        description: `Welcome to ${APP_NAME}`,
        openGraph: {
          title: `${APP_NAME} - Renaissance Mini App`,
          description: `Welcome to ${APP_NAME}`,
          images: [
            {
              url: "/thumbnail.jpg",
              width: 1200,
              height: 630,
              alt: APP_NAME,
            },
          ],
        },
        additionalMetaTags: [
          {
            name: 'fc:meta',
            content: JSON.stringify({
              slug: 'renaissance-app',
              title: APP_NAME,
              icon: `${appUrl}/thumbnail.jpg`,
            }),
          },
          {
            name: 'fc:miniapp',
            content: JSON.stringify({
              version: '1',
              imageUrl: `${appUrl}/thumbnail.jpg`,
              button: {
                title: `Open ${APP_NAME}`,
                action: {
                  type: 'launch_frame',
                  name: APP_NAME,
                  url: appUrl,
                  splashImageUrl: `${appUrl}/splash.png`,
                  splashBackgroundColor: '#ffffff',
                },
              },
            }),
          },
          {
            rel: 'alternate',
            type: 'application/json',
            href: `${appUrl}/.well-known/farcaster.json`,
          },
        ],
      },
    },
  };
};

const HomePage: React.FC = () => {
  const { user, isLoading } = useUser();

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    const callReady = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        
        if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
          console.log('✅ [Index] Calling sdk.actions.ready()');
          await sdk.actions.ready();
          console.log('✅ [Index] Successfully called ready()');
        }
      } catch (error) {
        console.error('❌ [Index] Error calling sdk.actions.ready():', error);
      }
    };

    callReady();
  }, []);

  // Show splash screen while loading or for authenticated users
  return <Splash user={user} isLoading={isLoading} appName={APP_NAME} />;
};

export default HomePage;
