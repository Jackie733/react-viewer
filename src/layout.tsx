import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppSidebar } from '@/components/AppSidebar';
import { FileLoader } from '@/components/FileLoader';
import ToolModule from '@/components/ToolModule';
import { useImageStore } from './store/image';

export default function Layout({ children }: { children: React.ReactNode }) {
  const hasData = useImageStore((state) => state.currentImage !== null);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex h-screen flex-1 flex-col">
        <div className="flex h-12 flex-shrink-0 items-center border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <FileLoader />
          </div>
          <Separator orientation="vertical" className="mx-1" />
          {hasData && <ToolModule />}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
