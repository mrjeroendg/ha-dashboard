import { useEffect, useRef, useState } from 'react';

/**
 * One value for a slider in the light sheet: your finger while you drag,
 * otherwise what HA reports. A report that differs only marginally from what
 * the app shows is ignored (HA rounds what it stores, e.g. kelvin to mireds),
 * and reports are ignored while you drag.
 */
export function useSliderValue(currentValueFromEntity: number | undefined, allowedDifferenceBetweenAppAndHass: number) {
  const [currentValueInApp, setCurrentValueInApp] = useState(currentValueFromEntity);
  const isDragging = useRef(false);

  useEffect(() => {
    if (isDragging.current) return;

    setCurrentValueInApp((previousValueInApp) => {
      if (currentValueFromEntity !== undefined && previousValueInApp !== undefined) {
        const differenceAppAndHass = Math.abs(currentValueFromEntity - previousValueInApp);
        const isDifferenceMarginal = differenceAppAndHass <= allowedDifferenceBetweenAppAndHass;

        return isDifferenceMarginal ? previousValueInApp : currentValueFromEntity;
      }

      return currentValueFromEntity;
    });
  }, [currentValueFromEntity, allowedDifferenceBetweenAppAndHass]);

  const showWhileDragging = (draggedValue: number) => {
    isDragging.current = true;
    setCurrentValueInApp(draggedValue);
  };

  const keepAfterRelease = (releasedValue: number) => {
    isDragging.current = false;
    setCurrentValueInApp(releasedValue);
  };

  const showValueFromEntity = () => setCurrentValueInApp(currentValueFromEntity);

  return { currentValueInApp, showWhileDragging, keepAfterRelease, showValueFromEntity };
}
