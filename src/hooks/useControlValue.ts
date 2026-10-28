import { useEffect, useRef, useState } from 'react';

/**
 * One value for a control in the light sheet (slider or colour wheel): your
 * finger while you drag, otherwise what HA reports. A report that differs only
 * marginally from what the app shows is ignored (HA rounds what it stores,
 * e.g. kelvin to mireds), and reports are ignored while you drag.
 */
export function useControlValue<Value>(
  currentValueFromEntity: Value | undefined,
  isDifferenceMarginal: (valueFromEntity: Value, valueInApp: Value) => boolean,
) {
  const [currentValueInApp, setCurrentValueInApp] = useState(currentValueFromEntity);
  const isDragging = useRef(false);
  // Compared by content, so a new array from HA with the same numbers doesn't count as a change.
  const valueFromEntityKey = JSON.stringify(currentValueFromEntity);

  useEffect(() => {
    if (isDragging.current) return;

    setCurrentValueInApp((previousValueInApp) => {
      if (currentValueFromEntity !== undefined && previousValueInApp !== undefined) {
        const isMarginal = isDifferenceMarginal(currentValueFromEntity, previousValueInApp);

        return isMarginal ? previousValueInApp : currentValueFromEntity;
      }

      return currentValueFromEntity;
    });
    // Only a new value from HA should update the app, not a new comparison function.
  }, [valueFromEntityKey]);

  const showWhileDragging = (draggedValue: Value) => {
    isDragging.current = true;
    setCurrentValueInApp(draggedValue);
  };

  const keepAfterRelease = (releasedValue: Value) => {
    isDragging.current = false;
    setCurrentValueInApp(releasedValue);
  };

  const showValueFromEntity = () => setCurrentValueInApp(currentValueFromEntity);

  return { currentValueInApp, showWhileDragging, keepAfterRelease, showValueFromEntity };
}
