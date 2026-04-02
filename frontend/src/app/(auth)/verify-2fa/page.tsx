import { Suspense } from 'react';
import { TwoFactorForm } from '@/components/auth/TwoFactorForm';

export default function VerifyTwoFactorPage() {
  return (
    <Suspense>
      <TwoFactorForm />
    </Suspense>
  );
}
