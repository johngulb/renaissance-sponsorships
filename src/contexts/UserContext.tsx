import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/db/user';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

interface SDKUser {
  fid: number | string;
  username?: string;
  displayName?: string;
  display_name?: string;
  pfpUrl?: string;
  pfp_url?: string;
  renaissanceUserId?: number | string;
}

// Helper to check if a user is valid (has Farcaster fid OR Renaissance account OR username)
const isValidUser = (user: SDKUser | null | undefined): boolean => {
  if (!user) return false;
  const fid = typeof user.fid === 'string' ? parseInt(user.fid, 10) : user.fid;
  // Valid if:
  // - Has any non-zero fid (positive for Farcaster, negative for Renaissance-only)
  // - Has renaissanceUserId (Renaissance backend user ID)
  // - Has a username
  return fid !== 0 || !!user.renaissanceUserId || !!user.username;
};

// Helper to try getting user from all possible SDK sources
const tryGetSDKUser = async (): Promise<SDKUser | null> => {
  if (typeof window === 'undefined') return null;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;
  
  // Try window.farcaster.context
  if (win.farcaster?.context) {
    try {
      const context = await Promise.resolve(win.farcaster.context);
      if (context?.user && isValidUser(context.user)) {
        console.log('🎯 Found user via window.farcaster.context');
        return context.user;
      }
    } catch (e) {
      console.log('⚠️ Error accessing farcaster.context:', e);
    }
  }
  
  // Try __renaissanceAuthContext
  if (win.__renaissanceAuthContext?.user) {
    const user = win.__renaissanceAuthContext.user;
    if (isValidUser(user)) {
      console.log('🎯 Found user via __renaissanceAuthContext');
      return user;
    }
  }
  
  // Try getRenaissanceAuth()
  if (typeof win.getRenaissanceAuth === 'function') {
    try {
      const context = win.getRenaissanceAuth();
      if (context?.user && isValidUser(context.user)) {
        console.log('🎯 Found user via getRenaissanceAuth()');
        return context.user;
      }
    } catch (e) {
      console.log('⚠️ Error calling getRenaissanceAuth:', e);
    }
  }
  
  // Try __FARCASTER_USER__
  if (win.__FARCASTER_USER__ && isValidUser(win.__FARCASTER_USER__)) {
    console.log('🎯 Found user via __FARCASTER_USER__');
    return win.__FARCASTER_USER__;
  }
  
  return null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'renaissance_app_user';

// Helper to get user from localStorage
const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Helper to store user in localStorage
const storeUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // Storage might be unavailable
  }
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync user state to localStorage whenever it changes
  useEffect(() => {
    storeUser(user);
  }, [user]);

  // Function to authenticate user from SDK context
  const authenticateFromSDK = async (sdkUser: SDKUser) => {
    try {
      console.log('🔐 Authenticating with SDK user:', sdkUser);
      
      const normalizedData = {
        fid: String(sdkUser.fid),
        username: sdkUser.username,
        displayName: sdkUser.displayName || sdkUser.display_name,
        pfpUrl: sdkUser.pfpUrl || sdkUser.pfp_url,
      };
      
      const authResponse = await fetch('/api/auth/miniapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(normalizedData),
      });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        if (authData.user) {
          console.log('✅ User authenticated successfully:', authData.user);
          setUser(authData.user);
          setError(null);
          return true;
        }
      } else {
        console.error('❌ Failed to authenticate with SDK user:', authResponse.status);
      }
    } catch (err) {
      console.error('❌ Error authenticating from SDK:', err);
    }
    return false;
  };

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let mounted = true;
    
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Quick check using our helper first
        const quickUser = await tryGetSDKUser();
        if (quickUser && mounted) {
          console.log('🚀 Quick user detection succeeded:', quickUser);
          const authenticated = await authenticateFromSDK(quickUser);
          if (authenticated) {
            setIsLoading(false);
            return;
          }
        }
        
        // Start polling for SDK context (context may load after page)
        let pollAttempts = 0;
        const maxPollAttempts = 20; // Poll for up to 10 seconds (500ms * 20)
        
        pollInterval = setInterval(async () => {
          pollAttempts++;
          console.log(`🔄 Polling for SDK user (attempt ${pollAttempts}/${maxPollAttempts})...`);
          
          const polledUser = await tryGetSDKUser();
          if (polledUser && mounted) {
            console.log('✅ Polling found user:', polledUser);
            if (pollInterval) clearInterval(pollInterval);
            const authenticated = await authenticateFromSDK(polledUser);
            if (authenticated) {
              setIsLoading(false);
            }
            return;
          }
          
          if (pollAttempts >= maxPollAttempts) {
            console.log('⏱️ Polling timed out, no user found');
            if (pollInterval) clearInterval(pollInterval);
            setIsLoading(false);
          }
        }, 500);
        
        if (typeof window !== 'undefined') {
          try {
            // Method 1: Use the imported SDK from @farcaster/miniapp-sdk
            try {
              const sdkModule = await import('@farcaster/miniapp-sdk');
              const sdk = sdkModule.sdk;
              
              if (sdk && sdk.context) {
                try {
                  let context: unknown;
                  if (typeof sdk.context.then === 'function') {
                    context = await sdk.context;
                  } else {
                    context = sdk.context;
                  }
                  
                  if (context && typeof context === 'object' && 'user' in context) {
                    const contextWithUser = context as { user?: SDKUser | Record<string, unknown> };
                    if (contextWithUser.user) {
                      const rawUser = contextWithUser.user as Record<string, unknown>;
                      const normalizedUser: SDKUser = {
                        fid: rawUser.fid as number | string,
                        username: rawUser.username as string | undefined,
                        displayName: (rawUser.displayName || rawUser.display_name) as string | undefined,
                        pfpUrl: (rawUser.pfpUrl || rawUser.pfp_url) as string | undefined,
                        renaissanceUserId: rawUser.renaissanceUserId as number | string | undefined,
                      };
                      
                      if (isValidUser(normalizedUser)) {
                        console.log('✅ Found user in SDK context:', normalizedUser);
                        const authenticated = await authenticateFromSDK(normalizedUser);
                        if (authenticated) {
                          setIsLoading(false);
                          return;
                        }
                      }
                    }
                  }
                } catch (e) {
                  console.log('⚠️ Error accessing SDK context:', e);
                }
              }
            } catch (importError) {
              console.log('⚠️ Could not import SDK:', importError);
            }
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const win = window as any;
            
            // Log all possible SDK locations for debugging
            console.log('🔍 Checking for SDK on window:', {
              hasFarcaster: !!win.farcaster,
              hasRenaissanceAuthContext: !!win.__renaissanceAuthContext,
              hasGetRenaissanceAuth: typeof win.getRenaissanceAuth === 'function',
              hasFarcasterSDK: !!win.FarcasterSDK,
              hasSDK: !!win.sdk,
              hasEarlySDK: !!win.__FARCASTER_SDK__,
              hasEarlyUser: !!win.__FARCASTER_USER__,
            });
            
            // Check for SDK stored by early detection script
            if (win.__FARCASTER_USER__) {
              console.log('✅ Found user from early detection:', win.__FARCASTER_USER__);
              const authenticated = await authenticateFromSDK(win.__FARCASTER_USER__);
              if (authenticated) {
                setIsLoading(false);
                return;
              }
            }
            
            // Listen for custom event from early detection
            const userEventHandler = (event: Event) => {
              const customEvent = event as CustomEvent<SDKUser>;
              console.log('📨 Received farcaster:user event:', customEvent.detail);
              if (customEvent.detail) {
                authenticateFromSDK(customEvent.detail);
              }
            };
            window.addEventListener('farcaster:user', userEventHandler);
            
            // Method 2: Use RPC - window.farcaster?.context
            if (win.farcaster && win.farcaster.context) {
              try {
                console.log('🔍 Trying window.farcaster.context (RPC method)...');
                const context = await win.farcaster.context;
                if (context && context.user && isValidUser(context.user)) {
                  console.log('✅ User found via window.farcaster.context:', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ Error accessing window.farcaster.context:', e);
              }
            }
            
            // Method 3: Check window.__renaissanceAuthContext
            if (win.__renaissanceAuthContext) {
              try {
                console.log('🔍 Trying window.__renaissanceAuthContext...');
                const context = win.__renaissanceAuthContext;
                if (context && context.user && isValidUser(context.user)) {
                  console.log('✅ User found via __renaissanceAuthContext:', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ Error accessing __renaissanceAuthContext:', e);
              }
            }
            
            // Method 4: Check window.getRenaissanceAuth() function
            if (typeof win.getRenaissanceAuth === 'function') {
              try {
                console.log('🔍 Trying window.getRenaissanceAuth()...');
                const context = win.getRenaissanceAuth();
                if (context && context.user && isValidUser(context.user)) {
                  console.log('✅ User found via getRenaissanceAuth():', context.user);
                  const authenticated = await authenticateFromSDK(context.user);
                  if (authenticated) {
                    setIsLoading(false);
                    return;
                  }
                }
              } catch (e) {
                console.log('⚠️ Error calling getRenaissanceAuth():', e);
              }
            }
            
            // Listen for farcaster:context:ready event
            const contextReadyHandler = ((event: CustomEvent) => {
              console.log('📨 Received farcaster:context:ready event:', event.detail);
              if (event.detail && event.detail.user && isValidUser(event.detail.user)) {
                authenticateFromSDK(event.detail.user);
              }
            }) as EventListener;
            window.addEventListener('farcaster:context:ready', contextReadyHandler);
            
            // Also listen for postMessage from iOS app
            const messageHandler = (event: MessageEvent) => {
              try {
                const messageData = typeof event.data === 'string' 
                  ? JSON.parse(event.data) 
                  : event.data;
                
                if (messageData) {
                  if (messageData.type === 'farcaster' && messageData.user) {
                    authenticateFromSDK(messageData.user);
                    return;
                  }
                  if (messageData.user && messageData.user.fid) {
                    authenticateFromSDK(messageData.user);
                    return;
                  }
                  if (messageData.fid && !messageData.type) {
                    authenticateFromSDK(messageData);
                    return;
                  }
                }
              } catch {
                // Not JSON or not user data
              }
            };
            window.addEventListener('message', messageHandler);
            
          } catch (sdkError) {
            console.error('❌ Error checking SDK context:', sdkError);
          }
        }
        
        // Wait for SDK to be injected
        console.log('⏳ Waiting for SDK to be available...');
        for (let i = 0; i < 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = window as any;
          const sdk = win.__FARCASTER_SDK__ || win.farcaster || win.FarcasterSDK || win.sdk;
          
          if (sdk && sdk.context && sdk.context.user) {
            console.log(`✅ SDK context found on attempt ${i + 1}:`, sdk.context.user);
            const authenticated = await authenticateFromSDK(sdk.context.user);
            if (authenticated) {
              setIsLoading(false);
              return;
            }
          }
          
          if (win.__FARCASTER_USER__) {
            console.log(`✅ User from early detection found on attempt ${i + 1}:`, win.__FARCASTER_USER__);
            const authenticated = await authenticateFromSDK(win.__FARCASTER_USER__);
            if (authenticated) {
              setIsLoading(false);
              return;
            }
          }
        }
        console.log('⏱️ Finished waiting for SDK');
        
        // Fallback: Check for userId in URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        const apiUrl = userId ? `/api/user/me?userId=${userId}` : '/api/user/me';
        
        console.log('📡 Fetching user from API:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const data = await response.json();
        
        if (data.user) {
          console.log('✅ User found from API:', data.user);
          setUser(data.user);
        } else {
          console.log('ℹ️ No user in API response');
        }
        
        // Clean up URL if user was found via URL param
        if (data.user && userId) {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, '', newUrl);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
    
    return () => {
      mounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
