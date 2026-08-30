import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

interface AuthFormProps {
  onSuccess: () => void;
}

/**
 * The actual login/signup/forgot-password UI — split out of `AuthDialog`
 * so it can be lazy-loaded. It's meaningful weight (three forms, all the
 * Supabase call sites) that a guest who never opens the dialog shouldn't
 * have to download.
 */
export function AuthForm({ onSuccess }: AuthFormProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"credentials" | "reset">("credentials");
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't log in", { description: error });
      return;
    }
    onSuccess();
    toast.success("Welcome back!");
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));

    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

    setSubmitting(true);
    const { error, needsEmailConfirmation } = await signUp(email, password);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't create account", { description: error });
      return;
    }
    onSuccess();
    if (needsEmailConfirmation) {
      toast.success("Check your email", {
        description: `We sent a confirmation link to ${email}.`,
      });
    } else {
      toast.success("Account created — you're logged in.");
    }
  }

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));

    setSubmitting(true);
    const { error } = await resetPassword(email);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't send reset link", { description: error });
      return;
    }
    onSuccess();
    toast.success("Check your email", {
      description: `We sent a password reset link to ${email}.`,
    });
  }

  if (mode === "reset") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>
            Enter your account email and we'll send you a link to set a new password.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4 pt-2" onSubmit={handleResetRequest}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <Button type="submit" className="mt-1" disabled={submitting}>
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("credentials")}
            className="text-center text-xs text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Back to log in
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Welcome to Inkbound Archive</DialogTitle>
        <DialogDescription>
          Sign in to sync favourites across devices, or create an account.
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue="login">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            Log in
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            Sign up
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form className="flex flex-col gap-4 pt-2" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-xs text-neutral-500 underline decoration-neutral-400 underline-offset-2 hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="login-password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="mt-1" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form className="flex flex-col gap-4 pt-2" onSubmit={handleSignup}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                required
                placeholder="At least 8 characters"
                minLength={8}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="signup-confirm">Confirm password</Label>
              <Input
                id="signup-confirm"
                name="confirm"
                type="password"
                required
                placeholder="Repeat your password"
                minLength={8}
              />
            </div>
            <Button type="submit" className="mt-1" disabled={submitting}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </>
  );
}
