import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export const useIDStore = create<{
  id: 0;
  nextID: () => string;
}>()(
  immer((set, get) => ({
    id: 0,
    nextID: () => {
      set((state) => {
        state.id++;
      });
      return get().id.toString();
    },
  })),
);
