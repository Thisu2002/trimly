export default function ClientSignup() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Client Sign up</h1>
      <a href="/auth/login?screen_hint=signup&role=customer">
        Create Customer Account
      </a>
    </main>
  );
}