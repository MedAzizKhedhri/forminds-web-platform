import { Suspense } from 'react';
import { VerifyEmailCard } from '@/components/auth/VerifyEmailCard';

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailCard />
    </Suspense>
  );
}
