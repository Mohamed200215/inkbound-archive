import { LogOut, User } from "lucide-react";
import { AuthDialog } from "@/components/layout/AuthDialog";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { SearchBar } from "@/components/layout/SearchBar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-neutral-50/85 backdrop-blur-md dark:border-white/10 dark:bg-neutral-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50"
        >
          <img src={logo} alt="" className="h-8 w-auto" />
          INKBOUND<span className="text-teal-500 dark:text-teal-400">.</span>
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  title={user.email}
                  className="border-black/15 bg-transparent px-2.5 text-neutral-700 hover:bg-black/5 hover:text-neutral-900 sm:px-3 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden max-w-40 truncate sm:inline">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-56 truncate font-normal text-neutral-500">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthDialog
              trigger={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-black/15 bg-transparent px-2.5 text-neutral-700 hover:bg-black/5 hover:text-neutral-900 sm:px-3 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <span className="hidden sm:inline">Login / Sign up</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              }
            />
          )}
          <SearchBar />
          <HamburgerMenu />
        </div>
      </div>
    </header>
  );
}
