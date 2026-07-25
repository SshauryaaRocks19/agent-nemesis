import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp appearance={{ elements: { headerTitle: "Sign up for AgentNemesis", headerSubtitle: "to continue to AgentNemesis" } }} />
    </div>
  );
}
