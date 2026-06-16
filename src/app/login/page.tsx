import { LoginForm } from "./login-form";
import { PrivacyNotice } from "@/components/privacy-notice";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const sp = await searchParams;
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "/";
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <LoginForm next={next} />
        <PrivacyNotice />
      </div>
    </main>
  );
}
