import { LPSAxisDir } from './lps';

export interface LayoutView {
  id: string;
  type: string;
  viewDirection: LPSAxisDir;
  viewUp: LPSAxisDir;
}

export interface Layout {
  name: string;
  icon: React.ElementType;
  views: LayoutView[][];
}
