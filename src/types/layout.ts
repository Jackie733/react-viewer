import { LPSAxisDir } from './lps';

export type ViewType = '2D' | '3D';

export interface LayoutView {
  id: string;
  type: ViewType;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
}

export interface Layout {
  name: string;
  icon: React.ElementType;
  views: LayoutView[][];
}
