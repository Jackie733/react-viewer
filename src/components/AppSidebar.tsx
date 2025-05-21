import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ModeToggle } from './ModeToggle';
import { Database as DatabaseIcon, LayoutGrid } from 'lucide-react';
import { DataBase } from './DataBase';
import { SampleData } from './SampleData';

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <LayoutGrid className="size-4" />
                <span className="text-base font-semibold">Viewer</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SampleData />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <DatabaseIcon />
          </SidebarGroupLabel>
          <DataBase />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
