import { useState, useRef, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import WrongPortalScreen from "./src/screens/WrongPortalScreen";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthUser } from "./src/types/auth";
import { API_BASE_URL } from "./src/config/api";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const isNewUserRef = useRef(false);

  function handleLoginSuccess(
    nextUser: AuthUser,
    token: string,
    isNewUser: boolean,
  ) {
    isNewUserRef.current = isNewUser;
    setUser(nextUser);
    setIdToken(token);
  }

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
