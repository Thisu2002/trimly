import { useState, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthUser } from "./src/types/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const isNewUserRef = useRef(false);

  function handleLoginSuccess(nextUser: AuthUser, token: string, isNewUser: boolean) {
    isNewUserRef.current = isNewUser;
    setUser(nextUser);
    setIdToken(token);
  }

  return (
    <SafeAreaProvider>
      <RootNavigator
        user={user}
        idToken={idToken}
        isNewUserRef={isNewUserRef}
        onLoginSuccess={handleLoginSuccess}
        onLogout={() => {
          isNewUserRef.current = false;
          setUser(null);
          setIdToken(null);
        }}
      />
    </SafeAreaProvider>
  );
}