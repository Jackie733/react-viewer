import { useEffect, useRef } from 'react';
import { ViewContext } from '@/types/views';
import { Maybe } from '@/types';

// Define specific interaction types for clarity
// PAN is no longer handled by this hook, so it can be removed if ZOOM is the only one left.
const InteractionType = {
  // PAN: 'pan', // Middle mouse button pan is now handled by useSliceGrabbing
  ZOOM: 'zoom',
} as const;

type Interaction = (typeof InteractionType)[keyof typeof InteractionType];

/**
 * Custom Hook to handle Zoom mouse interactions (right mouse button).
 * Window/Level is handled by useWindowManipulator.
 * Pan (slice grabbing) is handled by useSliceGrabbing.
 */
export function useMouseInteractions(
  viewContext: Maybe<ViewContext>,
  containerRef: React.RefObject<HTMLElement | HTMLDivElement | null>,
) {
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const interactionTypeRef = useRef<Interaction | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !viewContext) return;

    const handleMouseDown = (e: Event) => {
      const event = e as MouseEvent;
      // Left click (button 0) is handled by vtkMouseRangeManipulator for W/L (in useWindowManipulator)
      if (event.button === 0) return;
      // Middle click (button 1) is handled by useSliceGrabbing
      if (event.button === 1) return;

      event.preventDefault();
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };

      switch (event.button) {
        // case 1: // Middle mouse button for Pan - MOVED to useSliceGrabbing
        //   interactionTypeRef.current = InteractionType.PAN;
        //   document.body.style.cursor = 'grabbing';
        //   break;
        case 2: // Right mouse button for Zoom
          interactionTypeRef.current = InteractionType.ZOOM;
          document.body.style.cursor = 'zoom-in'; // Or let VTK zoom manipulator handle cursor
          break;
        default:
          interactionTypeRef.current = null;
      }
    };

    const handleMouseMove = (e: Event) => {
      const event = e as MouseEvent;
      if (!isDraggingRef.current || !interactionTypeRef.current || !viewContext)
        return;

      // const deltaX = event.clientX - lastMousePosRef.current.x; // No longer used for PAN
      const deltaY = event.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };

      switch (interactionTypeRef.current) {
        case InteractionType.ZOOM: {
          const { renderer, requestRender } = viewContext;
          const camera = renderer.getActiveCamera();
          const zoomFactor = 1.0 + deltaY * 0.01; // Sensitivity for zoom

          if (camera.getParallelProjection()) {
            let parallelScale = camera.getParallelScale();
            parallelScale *= zoomFactor;
            camera.setParallelScale(parallelScale);
          } else {
            camera.dolly(zoomFactor);
          }
          requestRender();
          break;
        }
        // case InteractionType.PAN: - MOVED to useSliceGrabbing
        //   ...
        //   break;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        interactionTypeRef.current = null;
        document.body.style.cursor = 'default';
      }
    };

    const handleContextMenu = (e: Event) => {
      const event = e as MouseEvent;
      event.preventDefault(); // Prevent browser context menu on right-click
    };

    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('contextmenu', handleContextMenu);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('contextmenu', handleContextMenu);
      document.body.style.cursor = 'default'; // Reset cursor on cleanup
    };
  }, [viewContext, containerRef]);

  // This hook now primarily sets up Zoom interactions (manual) and context menu prevention.
}
