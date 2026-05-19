'use client';

import { useEffect } from 'react';

export default function TestModeDetector() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true') {
      sessionStorage.setItem('test_mode', 'true');
    } else if (params.get('test') === 'false') {
      sessionStorage.removeItem('test_mode');
    }
  }, []);

  return null;
}
