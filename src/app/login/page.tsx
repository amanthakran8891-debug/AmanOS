import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/";
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <LoginForm next={next} />
    </main>
  );
}
