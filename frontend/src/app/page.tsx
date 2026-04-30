"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return null;

  const features = [
    {
      icon: Users,
      title: "Professional Network",
      description:
        "Connect with peers, mentors, and industry professionals to build meaningful relationships.",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      icon: Briefcase,
      title: "Career Opportunities",
      description:
        "Discover internships, jobs, and volunteering positions tailored to your skills.",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      icon: GraduationCap,
      title: "Showcase Skills",
      description:
        "Build your portfolio, highlight your education, and let your work speak for itself.",
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      icon: Sparkles,
      title: "Smart Matching",
      description:
        "AI-powered recommendations match you with the best opportunities and connections.",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "500+", label: "Companies" },
    { value: "2K+", label: "Opportunities" },
    { value: "95%", label: "Match Rate" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Image
              src="/LogoForMinds.png"
              alt="ForMinds"
              width={130}
              height={36}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center animate-slideUp">
            <Image
              src="/LogoForMinds.png"
              alt="ForMinds"
              width={300}
              height={84}
              className="mx-auto mb-6"
              priority
            />
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              Digital Community Engagement Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
              Connect, Collaborate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-700">
                & Grow
              </span>{" "}
              with ForMinds
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The platform that bridges students and organisations. Build your
              portfolio, showcase your skills, and discover your next
              opportunity.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base px-8 h-12 gradient-primary text-white border-0 hover:opacity-90"
                >
                  Create Your Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 h-12"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-primary">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to{" "}
              <span className="text-primary">succeed</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              ForMinds provides all the tools to build your professional
              presence and find the right opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`group rounded-2xl border bg-card p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slideUp stagger-${index + 1}`}
                >
                  <div
                    className={`inline-flex rounded-xl ${feature.bg} p-3 mb-4`}
                  >
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24 gradient-hero">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of students and organisations already on ForMinds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/register">
              <Button
                size="lg"
                className="text-base px-8 h-12 gradient-primary text-white border-0 hover:opacity-90"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Free to join
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> No credit card
              needed
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Set up in
              minutes
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/LogoForMinds.png"
                alt="ForMinds"
                width={100}
                height={28}
                className="h-6 w-auto opacity-70"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} ForMinds. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
