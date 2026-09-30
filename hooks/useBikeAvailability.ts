'use client';

import { useCallback, useEffect, useState } from 'react';
import { BIKE_CONFIG } from '@/data/schedule';

interface BikeSlot {
  className: string;
  dayName: string;
  hour: string;
  period: string;
  dateISO?: string;
}

interface Availability {
  key: string;
  status: 'ready' | 'loading' | 'error';
  takenBikes: number[];
}

export function useBikeAvailability(slot: BikeSlot | null) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Availability>({ key: '', status: 'loading', takenBikes: [] });
  const slotKey = slot ? new URLSearchParams({
    class_title: slot.className,
    day: slot.dayName,
    hour: `${slot.hour} ${slot.period}`,
    ...(slot.dateISO ? { class_date: slot.dateISO } : {}),
  }).toString() : '';
  const requestKey = `${slotKey}:${attempt}`;
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!slotKey) return;
    const controller = new AbortController();
    setResult({ key: requestKey, status: 'loading', takenBikes: [] });

    async function fetchAvailability() {
      try {
        const response = await fetch(`/api/bookings/available-bikes?${slotKey}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Availability request failed');
        const data: { takenBikes?: unknown } = await response.json();
        if (!Array.isArray(data.takenBikes) || !data.takenBikes.every((bike: unknown) =>
          typeof bike === 'number' && Number.isInteger(bike) && bike >= 1 && bike <= BIKE_CONFIG.total
        )) throw new Error('Invalid availability response');
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, status: 'ready', takenBikes: [...new Set(data.takenBikes as number[])] });
        }
      } catch {
        if (!controller.signal.aborted) setResult({ key: requestKey, status: 'error', takenBikes: [] });
      }
    }

    void fetchAvailability();
    return () => controller.abort();
  }, [slotKey, requestKey]);

  // A different date or retry invalidates the previous result before the effect runs.
  const status = !slotKey ? 'idle' : result.key === requestKey ? result.status : 'loading';
  const takenBikes = status === 'ready' ? result.takenBikes : [];
  const availableCount = status === 'ready'
    ? BIKE_CONFIG.total - new Set([...takenBikes, ...BIKE_CONFIG.maintenance]).size
    : null;

  return { slotKey, status, takenBikes, availableCount, retry };
}
