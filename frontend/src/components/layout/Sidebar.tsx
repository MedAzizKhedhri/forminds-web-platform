'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/components/layout/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  User,
  Settings,
  FolderOpen,
  Users,
  MessageSquare,
  Search,
  Briefcase,
  FileText,
  ClipboardList,
  Shield,
  ClipboardCheck,
  UserCheck,
  ScrollText,
  Calendar,
  Ticket,
  Sparkles,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  open: boolean;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('student' | 'recruiter' | 'admin')[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { t } = useLocale();

  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : '??';

  const sections: NavSection[] = [
    {
      title: 'Main',
      items: [
        {
          href: '/dashboard',
          label: t.nav?.dashboard || 'Dashboard',
          icon: LayoutDashboard,
        },
        {
          href: '/feed',
          label: t.nav?.feed || 'Feed',
          icon: MessageSquare,
        },
      ],
    },
    {
      title: 'Network',
      items: [
        {
          href: '/network',
          label: t.nav?.network || 'Network',
          icon: Users,
          roles: ['student', 'recruiter'],
        },
        {
          href: '/directory',
          label: t.nav?.directory || 'Directory',
          icon: Search,
        },
      ],
    },
    {
      title: 'Events',
      items: [
        {
          href: '/events',
          label: t.nav?.events || 'Events',
          icon: Calendar,
        },
        {
          href: '/events/mine',
          label: t.nav?.myEvents || 'My Events',
          icon: Calendar,
          roles: ['recruiter'],
        },
        {
          href: '/events/my-tickets',
          label: t.nav?.myTickets || 'My Tickets',
          icon: Ticket,
          roles: ['student', 'recruiter'],
        },
      ],
    },
    {
      title: 'Career',
      items: [
        {
          href: '/recommendations',
          label: t.nav?.recommendations || 'Recommendations',
          icon: Sparkles,
          roles: ['student'],
        },
        {
          href: '/opportunities',
          label: t.nav?.opportunities || 'Opportunities',
          icon: Briefcase,
        },
        {
          href: '/opportunities/mine',
          label: t.nav?.myOpportunities || 'My Opportunities',
          icon: ClipboardList,
          roles: ['recruiter'],
        },
        {
          href: '/applicants',
          label: t.nav?.applicants || 'Applicants',
          icon: Users,
          roles: ['recruiter'],
        },
        {
          href: '/applications',
          label: t.nav?.applications || 'My Applications',
          icon: FileText,
          roles: ['student'],
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          href: '/profile',
          label: t.nav?.profile || 'Profile',
          icon: User,
        },
        {
          href: '/projects',
          label: t.profile?.projects || 'My Projects',
          icon: FolderOpen,
          roles: ['student'],
        },
        {
          href: '/settings',
          label: t.nav?.settings || 'Settings',
          icon: Settings,
        },
      ],
    },
    {
      title: 'Admin',
      items: [
        {
          href: '/admin',
          label: t.nav?.adminDashboard || 'Admin Dashboard',
          icon: Shield,
          roles: ['admin'],
        },
        {
          href: '/admin/opportunities',
          label: t.nav?.adminOpportunities || 'Pending Opportunities',
          icon: ClipboardCheck,
          roles: ['admin'],
        },
        {
          href: '/admin/events',
          label: t.nav?.adminEvents || 'Pending Events',
          icon: Calendar,
          roles: ['admin'],
        },
        {
          href: '/admin/recruiters',
          label: t.nav?.adminRecruiters || 'Verify Organisations',
          icon: UserCheck,
          roles: ['admin'],
        },
        {
          href: '/admin/users',
          label: t.nav?.adminUsers || 'Users Management',
          icon: Users,
          roles: ['admin'],
        },
        {
          href: '/admin/audit-log',
          label: t.nav?.adminAuditLog || 'Audit Log',
          icon: ScrollText,
          roles: ['admin'],
        },
      ],
    },
  ];

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.roles) return true;
      return user?.role && item.roles.includes(user.role);
    });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/admin') return pathname === '/admin';
    if (href === '/opportunities') {
      return pathname === '/opportunities' || (!!pathname.match(/^\/opportunities\/[^/]+$/) && !pathname.startsWith('/opportunities/mine'));
    }
    if (href === '/events') {
      return pathname === '/events' || (!!pathname.match(/^\/events\/[^/]+$/) && !pathname.startsWith('/events/mine') && !pathname.startsWith('/events/my-tickets') && !pathname.startsWith('/events/create'));
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-30 flex h-[calc(100vh-4rem)] w-64 flex-col border-r bg-card transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
          {sections.map((section, sectionIndex) => {
            const filtered = filterItems(section.items);
            if (filtered.length === 0) return null;
            return (
              <div key={sectionIndex}>
                {sectionIndex > 0 && (
                  <Separator className="my-3" />
                )}
                {section.title && (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {filtered.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-primary/10 text-primary border-l-2 border-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom user card */}
        <div className="border-t p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
            onClick={onClose}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src={user?.avatar || undefined} alt={user?.firstName || 'User'} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
