import { useViewStore } from '@/store/view';
import { Layouts } from '@/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ViewLayout() {
  const currentLayout = useViewStore((state) => state.layout);
  const setLayout = useViewStore((state) => state.setLayout);

  const layoutNames = Object.keys(Layouts);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          title={currentLayout.name}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <currentLayout.icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[160px]">
        {layoutNames.map((layoutName) => {
          const layout = Layouts[layoutName];
          return (
            <DropdownMenuItem
              key={layoutName}
              onClick={() => setLayout(layoutName)}
            >
              <layout.icon className="mr-2 h-4 w-4" />
              <span>{layoutName}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
