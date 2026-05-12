'use client';

import { useEffect } from 'react';

export default function TestModeDetector() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true') {
      sessionStorage.setItem('test_mode', 'true');
    }
  }, []);

  return null;
}
