import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { FileLoader } from '@/components/FileLoader';
import MeasurementTools from '@/components/MeasurementTools';
import { useImageStore } from './store/image';

export default function Layout({ children }: { children: React.ReactNode }) {
  const hasData = useImageStore((state) => state.currentImage !== null);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex h-screen flex-1 flex-col">
        <div className="flex h-12 flex-shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <FileLoader />
          </div>
          {hasData && <MeasurementTools />}
          <div></div>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </SidebarProvider>
  );
}
