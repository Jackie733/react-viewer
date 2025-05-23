import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { vec3 } from 'gl-matrix';

export interface RulerData {
  id: string;
  sliceIndex: number;
  point1: vec3 | null;
  point2: vec3 | null;
  distance: number | null;
  color: [number, number, number];
  labelVisible: boolean;
  handlesVisible: boolean;
  lineVisible: boolean;
  isComplete: boolean;
}

export interface RulerState {
  rulers: Record<string, RulerData>;
  activeRulerId: string | null;
  nextRulerIdCounter: number;
  isRulerToolActive: boolean;

  addRuler: (initialData?: Partial<Omit<RulerData, 'id'>>) => string;
  updateRulerPoint: (
    id: string,
    pointNumber: 1 | 2,
    coordinates: vec3 | null,
  ) => void;
  completeRulerPlacement: (id: string, point2: vec3) => void;
  updateRulerProperties: (
    id: string,
    properties: Partial<
      Omit<RulerData, 'id' | 'point1' | 'point2' | 'distance' | 'isComplete'>
    >,
  ) => void;
  removeRuler: (id: string) => void;
  clearAllRulers: () => void;
  setActiveRulerId: (id: string | null) => void;
  setRulerToolActive: (active: boolean) => void;
}

const defaultRulerColor: [number, number, number] = [1, 1, 0];

export const useRulerStore = create<RulerState>()(
  subscribeWithSelector((set, get) => ({
    rulers: {},
    activeRulerId: null,
    nextRulerIdCounter: 1,
    isRulerToolActive: false,

    addRuler: (initialData) => {
      const id = `ruler-${get().nextRulerIdCounter}`;
      const newRuler: RulerData = {
        id,
        sliceIndex: initialData?.sliceIndex ?? 0,
        point1: initialData?.point1 ?? null,
        point2: initialData?.point2 ?? null,
        distance: null,
        color: initialData?.color ?? defaultRulerColor,
        labelVisible: initialData?.labelVisible ?? true,
        handlesVisible: initialData?.handlesVisible ?? true,
        lineVisible: initialData?.lineVisible ?? true,
        isComplete: false,
        ...initialData,
      };
      set((state) => ({
        rulers: { ...state.rulers, [id]: newRuler },
        nextRulerIdCounter: state.nextRulerIdCounter + 1,
        activeRulerId: id,
      }));
      return id;
    },

    updateRulerPoint: (id, pointNumber, coordinates) => {
      set((state) => {
        const ruler = state.rulers[id];
        if (!ruler) return state;

        const updatedRuler = { ...ruler };
        if (pointNumber === 1) {
          updatedRuler.point1 = coordinates ? vec3.clone(coordinates) : null;
        } else {
          updatedRuler.point2 = coordinates ? vec3.clone(coordinates) : null;
        }

        if (updatedRuler.point1 && updatedRuler.point2) {
          updatedRuler.distance = vec3.distance(
            updatedRuler.point1,
            updatedRuler.point2,
          );
        } else {
          updatedRuler.distance = null;
        }
        updatedRuler.isComplete = !!(
          updatedRuler.point1 && updatedRuler.point2
        );

        return {
          rulers: { ...state.rulers, [id]: updatedRuler },
        };
      });
    },

    completeRulerPlacement: (id, point2) => {
      set((state) => {
        const ruler = state.rulers[id];
        if (!ruler || !ruler.point1) return state;

        const p2Cloned = vec3.clone(point2);
        const distance = vec3.distance(ruler.point1, p2Cloned);

        const updatedRuler: RulerData = {
          ...ruler,
          point2: p2Cloned,
          distance,
          isComplete: true,
        };
        return {
          rulers: { ...state.rulers, [id]: updatedRuler },
          activeRulerId: null,
        };
      });
    },

    updateRulerProperties: (id, properties) => {
      set((state) => {
        const ruler = state.rulers[id];
        if (!ruler) return state;
        const updatedRuler = { ...ruler, ...properties };
        return {
          rulers: { ...state.rulers, [id]: updatedRuler },
        };
      });
    },

    removeRuler: (id) => {
      set((state) => {
        const newRulers = { ...state.rulers };
        delete newRulers[id];
        return {
          rulers: newRulers,
          activeRulerId:
            state.activeRulerId === id ? null : state.activeRulerId,
        };
      });
    },

    clearAllRulers: () => {
      set({ rulers: {}, activeRulerId: null });
    },

    setActiveRulerId: (id) => {
      set({ activeRulerId: id });
    },

    setRulerToolActive: (active) => {
      set({ isRulerToolActive: active });
    },
  })),
);

export const selectRulerById = (id: string | null) => (state: RulerState) =>
  id ? state.rulers[id] : undefined;

export const selectAllRulers = (state: RulerState) =>
  Object.values(state.rulers);
