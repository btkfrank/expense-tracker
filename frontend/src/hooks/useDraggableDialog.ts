import { useEffect, useRef } from 'react';
// import type { RefObject } from 'react';

interface UseDraggableDialogOptions {
  dialog: HTMLDialogElement | null;
  dragHandleSelector?: string;
}

export function useDraggableDialog({
  dialog,
  dragHandleSelector = '.dialog-header',
}: UseDraggableDialogOptions) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const initialLeft = useRef(0);
  const initialTop = useRef(0);

  useEffect(() => {
    if (!dialog) return;

    const dragHandle = dialog.querySelector(dragHandleSelector) as HTMLElement;
    if (!dragHandle) return;

    // Make the dialog positionable
    const updateDialogPosition = () => {
      if (dialog.style.position !== 'fixed') {
        dialog.style.position = 'fixed';
        dialog.style.margin = '0';
        // Center initially
        if (!dialog.style.left && !dialog.style.top) {
          dialog.style.left = '50%';
          dialog.style.top = '50%';
          dialog.style.transform = 'translate(-50%, -50%)';
        }
      }
    };

    updateDialogPosition();

    const handleMouseDown = (e: MouseEvent) => {
      // Only allow dragging from the header, not from buttons or other interactive elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.tagName === 'INPUT' ||
        target.closest('input')
      ) {
        return;
      }

      isDragging.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;

      // Get current position
      const rect = dialog.getBoundingClientRect();
      initialLeft.current = rect.left;
      initialTop.current = rect.top;

      // Change cursor
      dragHandle.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;

      const newLeft = initialLeft.current + deltaX;
      const newTop = initialTop.current + deltaY;

      // Keep dialog within viewport bounds
      const maxLeft = window.innerWidth - dialog.offsetWidth;
      const maxTop = window.innerHeight - dialog.offsetHeight;

      const constrainedLeft = Math.max(0, Math.min(newLeft, maxLeft));
      const constrainedTop = Math.max(0, Math.min(newTop, maxTop));

      dialog.style.left = `${constrainedLeft}px`;
      dialog.style.top = `${constrainedTop}px`;
      dialog.style.transform = 'none';
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        dragHandle.style.cursor = 'grab';
        document.body.style.userSelect = '';
      }
    };

    // Add event listeners
    dragHandle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Set initial cursor style
    dragHandle.style.cursor = 'grab';

    // Cleanup
    return () => {
      dragHandle.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      dragHandle.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dialog, dragHandleSelector]);
}
