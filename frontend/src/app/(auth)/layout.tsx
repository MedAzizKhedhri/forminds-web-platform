import Link from 'next/link';
import Image from 'next/image';
import { Users, Briefcase, GraduationCap, Sparkles } from 'lucide-react';
import { ImageCarousel } from '@/components/ui/image-carousel';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden gradient-primary flex-col items-center justify-center p-10 text-white">
        {/* Background decorative shapes */}
        <div className="absolute top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-32 -left-16 w-56 h-56 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-white/3 rounded-full blur-xl" />

        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Carousel */}
          <ImageCarousel
            images={[
              { src: '/1.jpg', alt: 'ForMinds community' },
              { src: '/3.jpg', alt: 'ForMinds platform' },
            ]}
          />

          {/* Tagline */}
          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
              Your professional journey{' '}
              <span className="text-white/90">starts here</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Connect with peers, showcase your skills, and discover opportunities that match your ambitions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, label: 'Professional Network' },
              { icon: Briefcase, label: 'Job Opportunities' },
              { icon: GraduationCap, label: 'Skill Building' },
              { icon: Sparkles, label: 'Smart Matching' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2.5 text-sm text-white/80">
                  <div className="rounded-lg bg-white/10 p-2">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 lg:w-1/2 lg:flex-none flex-col items-center justify-center bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center space-y-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/LogoForMinds.png"
                alt="ForMinds"
                width={240}
                height={68}
                className="h-16 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Form */}
          {children}

          {/* WEVE Digital */}
          <div className="mt-8 flex flex-col items-center space-y-4 w-full">
            <div className="w-full border-t border-border" />
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">By</p>
              <Image
                src="/weve.png"
                alt="WEVE Digital"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} ForMinds. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
