import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getCurrentUser } from "@/app/api/getUser";

export default async function Page() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Trimly</h1>
        <p><a href="/auth/login">Log in</a></p>
        <p><a href="/signup">Sign up</a></p>
      </main>
    );
  }

  const user = await getCurrentUser();
  //console.log("Page user:", user);

  if (!user) redirect("/auth/login");

  if (user.role === "customer") {
    redirect("/customer/home");
  } else {
    redirect("/admin/dashboard");
  }
}

// import { redirect } from "next/navigation";
// import { auth0 } from "@/lib/auth0";
// import { jwtDecode } from "jwt-decode";

// const ROLE_CLAIM = "https://trimly.app/roles";

// export default async function Page() {
//   const session = await auth0.getSession();

//   if (!session) {
//     return (
//       <main style={{ padding: 24 }}>
//         <h1>Trimly</h1>
//         <p>
//           <a href="/auth/login">Log in</a>
//         </p>
//         <p>
//           <a href="/signup">Sign up</a>
//         </p>
//       </main>
//     );
//   }

//   const idToken = session.tokenSet?.idToken;
//   type IdTokenPayload = {
//     [key: string]: unknown;
//   };

//   const payload: IdTokenPayload = idToken ? jwtDecode<IdTokenPayload>(idToken) : {};

//   const roles = payload[ROLE_CLAIM];
//   console.log("Payload:", payload);

//   const isAdmin = Array.isArray(roles) && roles.includes("admin");

//   redirect(isAdmin ? "/dashboard" : "/home");
// }
