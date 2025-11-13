'use client';

import { useCallback, useState } from 'react';

function buildKey(scope, id, field) {
  return `${scope}:${id}:${field}`;
}

export function useVisibilityState(initialState = {}) {
  const [visibilityMap, setVisibilityMap] = useState(initialState);

  const toggleVisibility = useCallback((scope, id, field) => {
    const key = buildKey(scope, id, field);
    setVisibilityMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const isVisible = useCallback(
    (scope, id, field) => {
      const key = buildKey(scope, id, field);
      return Boolean(visibilityMap[key]);
    },
    [visibilityMap],
  );

  const setVisibility = useCallback((scope, id, field, value) => {
    const key = buildKey(scope, id, field);
    setVisibilityMap((prev) => ({
      ...prev,
      [key]: Boolean(value),
    }));
  }, []);

  return {
    isVisible,
    toggleVisibility,
    setVisibility,
    visibilityMap,
    setVisibilityMap,
  };
}
