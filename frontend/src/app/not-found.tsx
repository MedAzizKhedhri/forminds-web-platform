import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 text-center">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
        </div>
        <h2 className="mb-4 text-center text-xl font-semibold text-gray-900">
          Page not found
        </h2>
        <p className="mb-6 text-center text-gray-600">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link href="/" className="block">
          <Button className="w-full">
            Go back home
          </Button>
        </Link>
      </div>
    </div>
  );
}
