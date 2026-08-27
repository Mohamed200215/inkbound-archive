import { type FormEvent, type ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

interface AuthDialogProps {
  trigger: ReactNode;
}

export function AuthDialog({ trigger }: AuthDialogProps) {
  const { signIn, signUp } = useAuth();
  const [open, setOpen] = useState(false);
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
    setOpen(false);
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
    setOpen(false);
    if (needsEmailConfirmation) {
      toast.success("Check your email", {
        description: `We sent a confirmation link to ${email}.`,
      });
    } else {
      toast.success("Account created — you're logged in.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
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
                <Label htmlFor="login-password">Password</Label>
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
      </DialogContent>
    </Dialog>
  );
}
