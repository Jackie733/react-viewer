import { useEffect, useRef } from 'react';
import { ViewContext } from '@/types/views';
import { Maybe } from '@/types';

// Define specific interaction types for clarity
const InteractionType = {
  PAN: 'pan',
  ZOOM: 'zoom',
} as const;

type Interaction = (typeof InteractionType)[keyof typeof InteractionType];

/**
 * Custom Hook to handle Pan and Zoom mouse interactions.
 * Window/Level is handled by useWindowManipulator.
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
      // Left click (button 0) is now handled by vtkMouseRangeManipulator for W/L
      if (event.button === 0) return; // Explicitly ignore left click for this hook's general drag

      event.preventDefault();
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: event.clientX, y: event.clientY };

      switch (event.button) {
        case 1: // Middle mouse button for Pan
          interactionTypeRef.current = InteractionType.PAN;
          document.body.style.cursor = 'grabbing';
          break;
        case 2: // Right mouse button for Zoom
          interactionTypeRef.current = InteractionType.ZOOM;
          document.body.style.cursor = 'zoom-in';
          break;
        default:
          interactionTypeRef.current = null;
      }
    };

    const handleMouseMove = (e: Event) => {
      const event = e as MouseEvent;
      if (!isDraggingRef.current || !interactionTypeRef.current || !viewContext)
        return;

      const deltaX = event.clientX - lastMousePosRef.current.x;
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
        case InteractionType.PAN: {
          const { renderer, requestRender } = viewContext;
          const camera = renderer.getActiveCamera();
          const position = camera.getPosition();
          const focalPoint = camera.getFocalPoint();
          const renderWindowView = viewContext.renderWindowView;
          const containerElement = renderWindowView?.getContainer();

          if (containerElement) {
            const { clientWidth: width, clientHeight: height } =
              containerElement;
            const dx = (-2 * deltaX) / width;
            const dy = (2 * deltaY) / height;
            const right = [1, 0, 0];
            const up = camera.getViewUp();

            for (let i = 0; i < 3; i++) {
              position[i] += dx * right[i] + dy * up[i];
              focalPoint[i] += dx * right[i] + dy * up[i];
            }
            camera.setPosition(position[0], position[1], position[2]);
            camera.setFocalPoint(focalPoint[0], focalPoint[1], focalPoint[2]);
            requestRender();
          }
          break;
        }
      }
    };

    const handleMouseUp = () => {
      // No event needed for mouseup body listener
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

  // This hook no longer returns window/level values.
  // It sets up Pan and Zoom interactions.
}
