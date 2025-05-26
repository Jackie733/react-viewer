import { LayoutPanelLeft, LayoutGrid, Square } from 'lucide-react';
import { SampleDataset } from '@/types';
import { Layout } from './types/layout';

export const ViewIDs = {
  Coronal: 'Coronal',
  Sagittal: 'Sagittal',
  Axial: 'Axial',
  Three: '3D',
  ObliqueCoronal: 'ObliqueCoronal',
  ObliqueSagittal: 'ObliqueSagittal',
  ObliqueAxial: 'ObliqueAxial',
  ObliqueThree: 'Oblique3D',
};

export const Layouts: Record<string, Layout> = [
  {
    name: 'Axial Only',
    icon: Square,
    views: [
      [
        {
          id: ViewIDs.Axial,
          type: '2D',
          viewDirection: 'Superior',
          viewUp: 'Anterior',
        },
      ],
    ],
  },
  {
    name: 'Axial Primary',
    icon: LayoutPanelLeft,
    views: [
      [
        {
          id: ViewIDs.Axial,
          type: '2D',
          viewDirection: 'Superior',
          viewUp: 'Anterior',
        },
      ],
      [
        {
          id: ViewIDs.Coronal,
          type: '2D',
          viewDirection: 'Posterior',
          viewUp: 'Superior',
        },
        {
          id: ViewIDs.Sagittal,
          type: '2D',
          viewDirection: 'Right',
          viewUp: 'Superior',
        },
      ],
    ],
  },
  {
    name: 'Quad View',
    icon: LayoutGrid,
    views: [
      [
        {
          id: ViewIDs.Axial,
          type: '2D',
          viewDirection: 'Superior',
          viewUp: 'Anterior',
        },
        {
          id: ViewIDs.Coronal,
          type: '2D',
          viewDirection: 'Posterior',
          viewUp: 'Superior',
        },
      ],
      [
        {
          id: ViewIDs.Three,
          type: '3D',
        },
        {
          id: ViewIDs.Sagittal,
          type: '2D',
          viewDirection: 'Right',
          viewUp: 'Superior',
        },
      ],
    ],
  },
].reduce((layouts, layout) => {
  return { ...layouts, [layout.name]: layout };
}, {});

export const SAMPLE_DATA: SampleDataset[] = [
  {
    name: 'CTA Head and Neck',
    filename: 'CTA-Head_and_Neck.zip',
    description:
      'CTA head and neck scan of elderly patient with tumor. (80 MB)',
    url: 'https://data.kitware.com/api/v1/item/6347159711dab81428208e24/download',
  },
  {
    name: 'MRA Head and Neck',
    filename: 'MRA-Head_and_Neck.zip',
    description:
      'MRA from Patient Contributed Image Repository. Click application help icon "(?)" for more info. (15 MB)',
    url: 'https://data.kitware.com/api/v1/item/6352a2b311dab8142820a33b/download',
  },
  {
    name: 'MRI Cardiac 3D and Cine',
    filename: 'MRI-Cardiac-3D_and_Cine.zip',
    description:
      'MRI scan with two series: 3D axial non-gated and 2 chamber cine. (4 MB)',
    url: 'https://data.kitware.com/api/v1/item/6350b28f11dab8142820949d/download',
  },
  {
    name: 'MRI PROSTATEx',
    filename: 'MRI-PROSTATEx-0004.zip',
    description:
      'MRI from the SPIE-AAPM-NCI PROSTATEx challenge. Click application help "(?)" icon for more info. (3 MB)',
    url: 'https://data.kitware.com/api/v1/item/63527c7311dab8142820a338/download',
  },
  {
    name: '3D US Fetus',
    filename: '3DUS-Fetus.mha',
    description:
      '3D ultrasound of a baby. Downloaded from tomovision.com.(8 MB)',
    url: 'https://data.kitware.com/api/v1/item/635679c311dab8142820a4f4/download',
    defaults: {
      colorPreset: 'US-Fetal',
    },
  },
];

export const DEFAULT_PRESET_BY_MODALITY: Record<string, string> = {
  CT: 'CT-AAA',
  MR: 'CT-Coronary-Arteries-2',
  US: 'US-Fetal',
};
export const DEFAULT_PRESET = 'CT-AAA';

export const WLPresetsCT = {
  Bones: {
    width: 1000,
    level: 400,
  },
  Air: {
    width: 1000,
    level: -426,
  },
  SoftTissue: {
    width: 350,
    level: 50,
  },
  Lungs: {
    width: 1500,
    level: -600,
  },
  Brain: {
    width: 80,
    level: 40,
  },
};
