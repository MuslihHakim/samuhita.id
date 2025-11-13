import { useState } from 'react';

export function useSelection(initialIds = []) {
  const [selected, setSelected] = useState(new Set(initialIds));

  const selectAll = (checked, ids = []) => {
    if (checked) {
      setSelected(new Set(ids));
    } else {
      setSelected(new Set());
    }
  };

  const selectOne = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const allSelected = (ids = []) => ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = (ids = []) => ids.some((id) => selected.has(id)) && !allSelected(ids);

  return {
    selectedSubmissions: selected,
    setSelectedSubmissions: setSelected,
    selectAll,
    selectOne,
    clearSelection,
    allSelected,
    someSelected,
  };
}

