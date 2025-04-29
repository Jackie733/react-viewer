import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import { FileLoader } from '@/components/FileLoader';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex h-screen flex-1 flex-col">
        <div className="flex h-12 flex-shrink-0 items-center border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-4 h-6" />
          <FileLoader />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
