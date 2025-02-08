"use client";

import { DoorOpenIcon, LogOut, Settings, User } from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import Image from "next/image";
import Link from "next/link";

export function NavUser() {
  const { data: session } = useSession();
  const router = useRouter();
  const { isMobile } = useSidebar();

  return (
    <DropdownMenu>
      <SidebarMenu>
        <SidebarMenuItem>
          {session ? (
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Image
                  src={session.user.image || "/placeholder.svg"}
                  alt={session.user.name}
                  className="size-8 shrink-0 rounded-lg"
                  width={32}
                  height={32}
                />
                <div className="ml-1 flex min-w-0 flex-col gap-1 leading-none">
                  <span className="font-semibold">{session.user.name}</span>
                  <span className="truncate">{session.user.email}</span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={async () => {
                await signIn.social({
                  provider: "google",
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M11.99 13.9v-3.72h9.36c.14.63.25 1.22.25 2.05c0 5.71-3.83 9.77-9.6 9.77c-5.52 0-10-4.48-10-10S6.48 2 12 2c2.7 0 4.96.99 6.69 2.61l-2.84 2.76c-.72-.68-1.98-1.48-3.85-1.48c-3.31 0-6.01 2.75-6.01 6.12s2.7 6.12 6.01 6.12c3.83 0 5.24-2.65 5.5-4.22h-5.51z"
                ></path>
              </svg>
              Sign in with Google
            </Button>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-64"
        align="end"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuItem>
          <User className="mr-2 size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center justify-between focus:bg-inherit"
          onSelect={(e) => {
            e.preventDefault();
          }}
        >
          Theme
          <ModeToggle />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Button
            variant={"ghost"}
            onClick={async () => {
              await signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
