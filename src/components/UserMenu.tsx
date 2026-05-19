"use client";

// Clerk UserButton with our custom "Browse history" menu item slotted in
// above the default ones. UserButton.Link routes through Next without a
// full reload.

import { UserButton } from "@clerk/nextjs";
import { HistoryIcon } from "./icons";

export default function UserMenu() {
  return (
    <UserButton
      appearance={{
        elements: { avatarBox: "h-8 w-8" },
      }}
    >
      <UserButton.MenuItems>
        <UserButton.Link
          label="Browse history"
          labelIcon={<HistoryIcon size={14} />}
          href="/history"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
