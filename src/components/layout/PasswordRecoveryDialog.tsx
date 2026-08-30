import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

/**
 * Appears automatically when Supabase reports a `PASSWORD_RECOVERY` event
 * — i.e. the user clicked the link from a "reset your password" email and
 * landed back here with a temporary recovery session. Lazy-loaded and
 * mounted unconditionally at the app root: unlike `AuthDialog`, there's no
 * visible trigger to gate loading behind, so `passwordRecovery` itself is
 * the only gate.
 */
export function PasswordRecoveryDialog() {
  const { passwordRecovery, updatePassword, clearPasswordRecovery } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));

    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      toast.error("Couldn't update your password", { description: error });
      return;
    }
    toast.success("Password updated");
  }

  return (
    <Dialog open={passwordRecovery} onOpenChange={(open) => !open && clearPasswordRecovery()}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Set a new password</DialogTitle>
          <DialogDescription>You're signed in via your password reset link.</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4 pt-2" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recovery-password">New password</Label>
            <Input
              id="recovery-password"
              name="password"
              type="password"
              required
              placeholder="At least 8 characters"
              minLength={8}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="recovery-confirm">Confirm password</Label>
            <Input
              id="recovery-confirm"
              name="confirm"
              type="password"
              required
              placeholder="Repeat your new password"
              minLength={8}
            />
          </div>
          <Button type="submit" className="mt-1" disabled={submitting}>
            {submitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
