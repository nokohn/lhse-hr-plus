import { useState, useEffect, useRef, useCallback } from 'react';

interface StoredDraft<T> {
  data: T;
  savedAt: number;
}

interface UseFormAutoSaveOptions<T> {
  formId: string;
  formData: T;
  setFormData: (value: T | ((prev: T) => T)) => void;
  initialData: T;
  isOpen?: boolean;
  debounceMs?: number;
}

export function useFormAutoSave<T>({
  formId,
  formData,
  setFormData,
  initialData,
  isOpen = true,
  debounceMs = 500,
}: UseFormAutoSaveOptions<T>) {
  const storageKey = `lhse_draft_${formId}`;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isRestored, setIsRestored] = useState(false);
  const initialMountRef = useRef(false);
  const timerRef = useRef<any>(null);

  // Check if saved draft exists on mount / when modal opens
  useEffect(() => {
    if (!isOpen) {
      initialMountRef.current = false;
      setIsRestored(false);
      return;
    }

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: StoredDraft<T> = JSON.parse(raw);
        if (parsed && parsed.data) {
          // Check if parsed data differs from initialData
          const isDifferent = JSON.stringify(parsed.data) !== JSON.stringify(initialData);
          if (isDifferent) {
            setFormData(parsed.data);
            setHasDraft(true);
            setIsRestored(true);
            if (parsed.savedAt) {
              setLastSaved(new Date(parsed.savedAt));
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[AutoSave] Error loading draft for ${formId}:`, e);
    }
    initialMountRef.current = true;
  }, [isOpen, formId]);

  // Debounced save when formData changes
  useEffect(() => {
    if (!isOpen || !initialMountRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const isDifferentFromInitial = JSON.stringify(formData) !== JSON.stringify(initialData);

    if (!isDifferentFromInitial) {
      // Nothing custom entered; if we already cleared draft, don't re-save empty
      return;
    }

    setIsSaving(true);
    timerRef.current = setTimeout(() => {
      try {
        const payload: StoredDraft<T> = {
          data: formData,
          savedAt: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastSaved(new Date());
        setHasDraft(true);
      } catch (e) {
        console.warn(`[AutoSave] Failed to save draft for ${formId}:`, e);
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [formData, isOpen, formId, debounceMs]);

  // Clear draft from localStorage (to be called after successful submit)
  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn(`[AutoSave] Error removing draft for ${formId}:`, e);
    }
    setHasDraft(false);
    setIsRestored(false);
    setLastSaved(null);
  }, [storageKey, formId]);

  // Discard draft: wipes storage and resets form to initial state
  const discardDraft = useCallback(() => {
    clearDraft();
    setFormData(initialData);
  }, [clearDraft, setFormData, initialData]);

  // Explicit immediate save
  const saveNow = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const payload: StoredDraft<T> = {
        data: formData,
        savedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastSaved(new Date());
      setHasDraft(true);
      setIsSaving(false);
    } catch (e) {
      console.warn(`[AutoSave] Error saving draft for ${formId}:`, e);
    }
  }, [formData, storageKey, formId]);

  return {
    isSaving,
    lastSaved,
    hasDraft,
    isRestored,
    clearDraft,
    discardDraft,
    saveNow,
  };
}
