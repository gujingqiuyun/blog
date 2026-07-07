import { useState, useRef, useCallback, useEffect } from 'react';

export function useHistory(initialValue) {
  const [value, setValue] = useState(initialValue);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const skipNext = useRef(false);

  const set = useCallback((newVal) => {
    if (skipNext.current) { skipNext.current = false; setValue(newVal); return; }
    setValue(prev => {
      undoStack.current.push(prev);
      redoStack.current = [];
      return typeof newVal === 'function' ? newVal(prev) : newVal;
    });
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    setValue(prev => {
      redoStack.current.push(prev);
      const restored = undoStack.current.pop();
      skipNext.current = true;
      return restored;
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    setValue(prev => {
      undoStack.current.push(prev);
      const restored = redoStack.current.pop();
      skipNext.current = true;
      return restored;
    });
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.metaKey && !e.ctrlKey) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return [value, set, undo, redo];
}
