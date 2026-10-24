import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface Props {
  /** Read out by screen readers, e.g. "Veiligheid". */
  label: string;
  /** Extra class for a sheet's own spacing, e.g. "safety-sheet". */
  className?: string;
  /** Shown under the handle, e.g. page dots. Dragging there closes the sheet too. */
  besideHandle?: ReactNode;
  onClose(): void;
  children: ReactNode;
}

/** How far you have to drag the handle down before the sheet closes. */
const CLOSE_DISTANCE = 90;

/**
 * The frame every bottom sheet shares: a dimmed page behind it, a handle,
 * swipe the handle down or tap beside the sheet to close. What's inside is
 * up to the sheet.
 */
export function BottomSheet({ label, className, besideHandle, onClose, children }: Props) {
  const [dragDistance, setDragDistance] = useState(0);
  const dragStartY = useRef<number | null>(null);

  const startDraggingHandle = (pointerEvent: PointerEvent) => {
    dragStartY.current = pointerEvent.clientY;
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
  };
  const followHandle = (pointerEvent: PointerEvent) => {
    if (dragStartY.current !== null) setDragDistance(Math.max(0, pointerEvent.clientY - dragStartY.current));
  };
  const releaseHandle = () => {
    const isDraggedFarEnough = dragDistance > CLOSE_DISTANCE;
    dragStartY.current = null;
    setDragDistance(0);
    if (isDraggedFarEnough) onClose();
  };

  const isDragging = dragDistance > 0;

  return (
    <>
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      <div
        className={`bottom-sheet${className ? ` ${className}` : ''}${isDragging ? ' is-dragging' : ''}`}
        style={isDragging ? { transform: `translateY(${dragDistance}px)` } : undefined}
        role="dialog"
        aria-label={label}
      >
        <div
          className="bottom-sheet__grab"
          onPointerDown={startDraggingHandle}
          onPointerMove={followHandle}
          onPointerUp={releaseHandle}
          onPointerCancel={releaseHandle}
        >
          <span className="xp__handle" />
          {besideHandle}
        </div>
        {children}
      </div>
    </>
  );
}
