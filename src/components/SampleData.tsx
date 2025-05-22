import { ChevronRight, DatabaseIcon, Loader2 } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SAMPLE_DATA } from '@/config';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from './ui/sidebar';
import { SampleDataset } from '@/types';
import { useState } from 'react';
import { importDataSources } from '@/io/import/importDataSources';
import { remoteFileToDataSource } from '@/io/import/dataSource';
import { fetchFileWithProgress } from '@/utils/fetch';
import { CircularProgress } from './CircularProgress';
import { partitionResults } from '@/core/pipeline';
import { filterLoadableDataSources } from '@/core/loadFiles';
import { importService } from '@/services/importService';

export function SampleData() {
  const data = {
    title: 'Sample Data',
    items: SAMPLE_DATA,
  };

  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: {
      status: 'idle' | 'loading' | 'loaded' | 'error';
      progress?: number;
      error?: string;
      canShowProgress?: boolean;
    };
  }>({});

  const downloadSample = async (item: SampleDataset) => {
    const progress = (percent: number) => {
      setLoadingStates((prev) => ({
        ...prev,
        [item.name]: {
          ...prev[item.name],
          status: 'loading',
          canShowProgress: true,
          progress: percent * 100,
        },
      }));
    };

    setLoadingStates((prev) => ({
      ...prev,
      [item.name]: { status: 'loading', progress: 0, canShowProgress: false },
    }));
    try {
      const sampleFile = await fetchFileWithProgress(
        item.url,
        item.filename,
        progress,
        undefined,
      );
      if (!sampleFile) {
        throw new Error('Did not receive a file.');
      }
      setLoadingStates((prev) => ({
        ...prev,
        [item.name]: {
          ...prev[item.name],
          status: 'loaded',
          progress: 100,
        },
      }));

      const results = await importDataSources([
        remoteFileToDataSource(sampleFile, item.url),
      ]);

      const [succeeded, errored] = partitionResults(results);
      if (succeeded.length) {
        const loadableDataSources = filterLoadableDataSources(succeeded);
        if (loadableDataSources.length > 0) {
          importService.selectPrimaryFromResults(loadableDataSources);
        }
      }

      if (errored.length) {
        console.error('Error loading files:', errored);
      }
    } catch (error) {
      console.error(`Error downloading ${item.name}:`, error);
      setLoadingStates((prev) => ({
        ...prev,
        [item.name]: {
          ...prev[item.name],
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        },
      }));
    }
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        <Collapsible
          key={data.title}
          asChild
          defaultOpen
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={data.title}>
                <DatabaseIcon />
                <span>{data.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {data.items.map((subItem) => {
                  const state = loadingStates[subItem.name];
                  const isLoading = state?.status === 'loading';
                  const progress = state?.progress ?? 0;
                  const canShowProgress = state?.canShowProgress ?? false;

                  return (
                    <SidebarMenuSubItem className="flex" key={subItem.name}>
                      <SidebarMenuSubButton asChild>
                        <div
                          className={`flex w-full items-center ${isLoading ? 'cursor-wait' : 'cursor-pointer'}`}
                          onClick={() => {
                            if (!isLoading) {
                              downloadSample(subItem);
                            }
                          }}
                          aria-disabled={isLoading}
                        >
                          <span>{subItem.name}</span>
                        </div>
                      </SidebarMenuSubButton>
                      <div>
                        {isLoading &&
                          (canShowProgress && progress > 0 && progress < 100 ? (
                            <CircularProgress progress={progress} />
                          ) : (
                            <Loader2 className="ml-2 h-6 w-6 animate-spin" />
                          ))}
                      </div>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      </SidebarMenu>
    </SidebarGroup>
  );
}
