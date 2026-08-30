import { lazy, Suspense, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const AuthForm = lazy(() => import("@/components/layout/AuthForm").then((m) => ({ default: m.AuthForm })));

interface AuthDialogProps {
  trigger: ReactNode;
}

/**
 * The shell (trigger + dialog chrome) stays eager since the trigger is
 * always visible for guests; the actual login/signup/reset forms are
 * lazy-loaded and, once fetched on first open, kept mounted for the rest
 * of the session so the dialog's close transition still plays normally.
 */
export function AuthDialog({ trigger }: AuthDialogProps) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setEverOpened(true);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {everOpened && (
          <Suspense
            fallback={
              <>
                <DialogTitle className="sr-only">Loading</DialogTitle>
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-neutral-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              </>
            }
          >
            <AuthForm onSuccess={() => setOpen(false)} />
          </Suspense>
        )}
      </DialogContent>
    </Dialog>
  );
}
