import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ModeToggle } from './ModeToggle';
import { LayoutGrid } from 'lucide-react';
import { DataBase } from './DataBase';
import { SampleData } from './SampleData';
import { useImageStore } from '@/store/image';

export function AppSidebar() {
  const hasData = useImageStore((state) => state.currentImage !== null);

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
          {hasData ? (
            <DataBase />
          ) : (
            <SidebarMenu>
              <SampleData />
            </SidebarMenu>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
