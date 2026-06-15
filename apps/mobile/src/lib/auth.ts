// src/lib/auth.ts
import { Platform } from "react-native";
import Auth0 from "react-native-auth0";

export const auth0 = new Auth0({
  domain: "trimly.us.auth0.com",
  clientId: "3GOSQi4nhrKF5eU4dzWMl6XTOV4dcr5q",
});

export async function webAuth0Login(): Promise<{ idToken: string }> {
  if (Platform.OS !== "web") {
    const credentials = await auth0.webAuth.authorize({
      scope: "openid profile email",
    });
    return { idToken: credentials.idToken };
  }

  const { Auth0Client } = await import("@auth0/auth0-spa-js");
  const client = new Auth0Client({
    domain: "trimly.us.auth0.com",
    clientId: "3GOSQi4nhrKF5eU4dzWMl6XTOV4dcr5q",
    authorizationParams: {
      redirect_uri: window.location.origin,
      scope: "openid profile email",
    },
  });

  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {
    await client.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  } else {
    await client.loginWithRedirect();
    return { idToken: "" };
  }

  const claims = await client.getIdTokenClaims();
  if (!claims?.__raw) throw new Error("No ID token returned");
  return { idToken: claims.__raw };
}