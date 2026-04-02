import { PublicProfileView } from '@/components/profile/PublicProfileView';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <PublicProfileView username={username} />
    </div>
  );
}
