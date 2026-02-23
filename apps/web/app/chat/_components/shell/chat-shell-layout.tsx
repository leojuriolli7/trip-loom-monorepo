"use client";

import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ChatInputPanel } from "./chat-input-panel";
import { ChatSidebar } from "./chat-sidebar";
import { ChatTopbar } from "./chat-topbar";

export function ChatShellLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-svh overflow-hidden">
      <ChatSidebar />

      <SidebarInset className="flex min-h-0 flex-col overflow-hidden">
        <ChatTopbar />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        <ChatInputPanel />
      </SidebarInset>
    </SidebarProvider>
  );
}
