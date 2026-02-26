'use client'

import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { NavRecentSessions } from '@/components/nav-sessions'
import { NavMain } from '@/components/nav-main'
import { NavSecondary } from '@/components/nav-secondary'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { MessageSquare } from 'lucide-react'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />}>
              <MessageSquare className="size-5" />
              <span className="text-base font-semibold">clankie</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavRecentSessions />
        <NavSecondary className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
