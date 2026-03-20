import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthUser } from "./src/types/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  function handleLoginSuccess(nextUser: AuthUser, token: string) {
    setUser(nextUser);
    setIdToken(token);
  }

  return (
    <SafeAreaProvider>
      <RootNavigator
        user={user}
        idToken={idToken}
        onLoginSuccess={handleLoginSuccess}
        onLogout={() => {
          setUser(null);
          setIdToken(null);
        }}
      />
    </SafeAreaProvider>
  );
}
