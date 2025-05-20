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
import React, { useState } from 'react';
import { importDataSources } from '@/io/import/importDataSources';
import { fileToDataSource } from '@/io/import/dataSource';

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const radius = 10;
  const strokeWidth = 2;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const offset = circumference - (progress / 100) * circumference;
  const svgSize = (radius + strokeWidth) * 2;

  return (
    <svg
      className="ml-2 -rotate-90 transform"
      width={svgSize}
      height={svgSize}
      viewBox={`0 0 ${svgSize} ${svgSize}`}
    >
      <circle
        className="text-gray-300 dark:text-gray-300"
        strokeWidth={strokeWidth}
        stroke="currentColor"
        fill="transparent"
        r={normalizedRadius}
        cx={svgSize / 2}
        cy={svgSize / 2}
      />
      <circle
        className="text-blue-500"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke="currentColor"
        fill="transparent"
        r={normalizedRadius}
        cx={svgSize / 2}
        cy={svgSize / 2}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="origin-center rotate-90 text-xs text-gray-700 dark:text-gray-300"
        fill="currentColor"
      >
        {Math.round(progress)}
      </text>
    </svg>
  );
};

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

  const handleLoadData = async (item: SampleDataset) => {
    if (loadingStates[item.name]?.status === 'loading') {
      console.log(`Data ${item.name} is already loading.`);
      return;
    }

    setLoadingStates((prev) => ({
      ...prev,
      [item.name]: { status: 'loading', progress: 0, canShowProgress: false },
    }));

    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(
          `Failed to download ${item.name}: ${response.statusText}`,
        );
      }

      const contentLength = response.headers.get('Content-Length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      const canShowProgress = totalSize > 0 && response.body != null;

      setLoadingStates((prev) => ({
        ...prev,
        [item.name]: {
          ...prev[item.name],
          status: 'loading',
          progress: 0,
          canShowProgress: canShowProgress,
        },
      }));

      if (!response.body) {
        const blob = await response.blob();
        const file = new File([blob], item.name, {
          type: blob.type || 'application/octet-stream',
        });
        console.log(file);

        setLoadingStates((prev) => ({
          ...prev,
          [item.name]: { ...prev[item.name], status: 'loaded', progress: 100 },
        }));
        console.log(`Successfully loaded ${item.name} (no stream).`);
        return;
      }

      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        chunks.push(value);
        receivedLength += value.length;

        if (canShowProgress) {
          const progress = (receivedLength / totalSize) * 100;
          setLoadingStates((prev) => ({
            ...prev,
            [item.name]: {
              ...prev[item.name],
              status: 'loading',
              progress: Math.min(progress, 100),
              canShowProgress: true,
            },
          }));
        }
      }

      const blob = new Blob(chunks);
      const file = new File([blob], item.name, {
        type: blob.type || 'application/octet-stream',
      });
      console.log('downloaded file', file);

      const [result] = await importDataSources([fileToDataSource(file)]);
      console.log('import result', result);

      setLoadingStates((prev) => ({
        ...prev,
        [item.name]: { ...prev[item.name], status: 'loaded', progress: 100 },
      }));
      console.log(`Successfully loaded ${item.name}`);
    } catch (error) {
      console.error(`Error loading data ${item.name}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setLoadingStates((prev) => ({
        ...prev,
        [item.name]: {
          status: 'error',
          error: errorMessage,
          progress: prev[item.name]?.progress || 0,
          canShowProgress: prev[item.name]?.canShowProgress || false,
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
                              handleLoadData(subItem);
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
