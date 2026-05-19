import Link from "next/link";
import { Show } from "@clerk/nextjs";
import UserMenu from "./UserMenu";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--primary)] font-serif text-lg font-bold text-white">
            P
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight text-[var(--ink)]">
            PressHub
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-bg)]"
          >
            Home
          </Link>
          <Link
            href="/explore"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--muted-bg)]"
          >
            Explore
          </Link>

          <div className="ml-2 flex items-center">
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--primary-dark)] transition-colors"
              >
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <UserMenu />
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
}
