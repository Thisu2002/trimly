//D:\trimly\apps\mobile\App.tsx
import { useState, useRef, useCallback, useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Font from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import WrongPortalScreen from "./src/screens/WrongPortalScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthUser } from "./src/types/auth";
import { API_BASE_URL } from "./src/config/api";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const isNewUserRef = useRef(false);
  useEffect(() => {
  Font.loadAsync({
    ...Ionicons.font,
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  }).catch(() => {
  }).finally(() => setFontsLoaded(true));
}, []);

  function handleLoginSuccess(
    nextUser: AuthUser,
    token: string,
    isNewUser: boolean,
  ) {
    isNewUserRef.current = isNewUser;
    setUser(nextUser);
    setIdToken(token);
  }
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const query = window.location.search;
    if (!query.includes("code=") || !query.includes("state=")) return;

    async function completeWebLogin() {
      try {
        const { Auth0Client } = await import("@auth0/auth0-spa-js");
        const client = new Auth0Client({
          domain: "trimly.us.auth0.com",
          clientId: "3GOSQi4nhrKF5eU4dzWMl6XTOV4dcr5q",
          authorizationParams: {
            redirect_uri: window.location.origin,
            scope: "openid profile email",
          },
        });

        await client.handleRedirectCallback();
        window.history.replaceState({}, document.title, "/");

        const claims = await client.getIdTokenClaims();
        if (!claims?.__raw) return;

        const idToken = claims.__raw;
        const { jwtDecode } = await import("jwt-decode");
        const decoded = jwtDecode<{
          sub?: string;
          email?: string;
          picture?: string;
        }>(idToken);

        const res = await fetch(`${API_BASE_URL}/api/auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        const data = await res.json();
        if (!res.ok) return;

        handleLoginSuccess(
          {
            name: data.user.name,
            email: decoded.email,
            picture: decoded.picture,
            sub: decoded.sub,
            role: data.user.role,
          },
          idToken,
          data.isNewUser,
        );
      } catch (err) {
        console.error("Web login completion failed:", err);
      }
    }

    completeWebLogin();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!idToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const dbUser = data.user;

      setUser((prev) => ({
        ...prev,
        name: dbUser.name,
        email: dbUser.email,
        sub: dbUser.auth0Sub ?? prev?.sub,
      }));
    } catch (err) {
      console.warn("[App] refreshUser failed:", err);
    }
  }, [idToken]);

  return (
    <SafeAreaProvider>
      {user && user.role != "customer" ? (
        <WrongPortalScreen
          onLogout={() => {
            setUser(null);
            setIdToken(null);
          }}
        />
      ) : (
        <RootNavigator
          user={user}
          idToken={idToken}
          isNewUserRef={isNewUserRef}
          onLoginSuccess={handleLoginSuccess}
          onRefreshUser={refreshUser}
          onLogout={() => {
            isNewUserRef.current = false;
            setUser(null);
            setIdToken(null);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
