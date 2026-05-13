import { Suspense } from 'react';
import ReservaContent from './content';

export default function ReservaExitosa() {
  return (
    <Suspense>
      <ReservaContent />
    </Suspense>
  );
}
