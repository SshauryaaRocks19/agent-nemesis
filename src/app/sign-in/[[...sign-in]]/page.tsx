import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn appearance={{ elements: { headerTitle: "Sign in to AgentNemesis", headerSubtitle: "to continue to AgentNemesis" } }} />
    </div>
  );
}
