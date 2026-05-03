import { Suspense } from 'react';
import LoginForm from './LoginForm.client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B]" />}>
      <LoginForm />
    </Suspense>
  );
}
