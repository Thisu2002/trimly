import { useState } from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthUser } from "./src/types/auth";

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  return (
    <RootNavigator
      user={user}
      onLoginSuccess={setUser}
      onLogout={() => setUser(null)}
    />
  );
}