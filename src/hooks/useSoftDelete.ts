import { useState, useEffect, useCallback } from 'react';

const SOFT_DELETE_KEY = 'pending_deletes';
const DELETE_TIMEOUT_MS = 30000; // 30 seconds

interface PendingDelete {
  id: string;
  timestamp: number;
  data: any;
}

export const useSoftDelete = () => {
  const [pendingDeletes, setPendingDeletes] = useState<PendingDelete[]>([]);

  // Load pending deletes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SOFT_DELETE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPendingDeletes(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Failed to parse pending deletes:', error);
        setPendingDeletes([]);
      }
    }
  }, []);

  // Save to localStorage whenever pendingDeletes change
  useEffect(() => {
    localStorage.setItem(SOFT_DELETE_KEY, JSON.stringify(pendingDeletes));
  }, [pendingDeletes]);

  // Check for expired deletes every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setPendingDeletes((prev) =>
        prev.filter((item) => now - item.timestamp < DELETE_TIMEOUT_MS)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Schedule a delete
  const scheduleDelete = useCallback((id: string, data?: any) => {
    const pendingDelete: PendingDelete = {
      id,
      timestamp: Date.now(),
      data: data || null,
    };

    setPendingDeletes((prev) => [...prev, pendingDelete]);
    return pendingDelete;
  }, []);

  // Undo a delete
  const undoDelete = useCallback((id: string) => {
    const item = pendingDeletes.find((pd) => pd.id === id);
    setPendingDeletes((prev) => prev.filter((pd) => pd.id !== id));
    return item;
  }, [pendingDeletes]);

  // Check if an item is pending deletion
  const isPendingDelete = useCallback(
    (id: string) => {
      return pendingDeletes.some((pd) => pd.id === id);
    },
    [pendingDeletes]
  );

  // Get all expired deletes that should be permanently deleted
  const getExpiredDeletes = useCallback(() => {
    const now = Date.now();
    const expired = pendingDeletes.filter(
      (item) => now - item.timestamp >= DELETE_TIMEOUT_MS
    );

    // Remove expired items from pending
    if (expired.length > 0) {
      setPendingDeletes((prev) =>
        prev.filter((item) => now - item.timestamp < DELETE_TIMEOUT_MS)
      );
    }

    return expired;
  }, [pendingDeletes]);

  // Get time remaining for a pending delete (in seconds)
  const getTimeRemaining = useCallback(
    (id: string) => {
      const item = pendingDeletes.find((pd) => pd.id === id);
      if (!item) return 0;

      const now = Date.now();
      const elapsed = now - item.timestamp;
      const remaining = DELETE_TIMEOUT_MS - elapsed;

      return Math.max(0, Math.ceil(remaining / 1000));
    },
    [pendingDeletes]
  );

  return {
    pendingDeletes,
    scheduleDelete,
    undoDelete,
    isPendingDelete,
    getExpiredDeletes,
    getTimeRemaining,
  };
};
