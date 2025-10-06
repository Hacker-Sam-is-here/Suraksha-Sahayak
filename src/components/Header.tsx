import Link from 'next/link';
import { Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/80 via-background/40 to-transparent">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <Shield className="h-8 w-8 text-primary group-hover:animate-pulse" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Suraksha Sahayak
          </span>
        </Link>
        <Link href="/admin">
          <Button variant="outline" className="gap-2 bg-background/80 backdrop-blur-sm">
            <UserCog className="h-4 w-4" />
            <span className='hidden sm:inline'>Admin Portal</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
