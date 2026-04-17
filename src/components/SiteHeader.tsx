import { Link, useRouter } from "@tanstack/react-router";
import { ShieldCheck, LogOut, History, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SiteHeader() {
  const { user } = useAuth();
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.navigate({ to: "/" });
  }

  return (
    <header className="border-b border-border/40 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[oklch(0.7_0.18_240)] shadow-[var(--shadow-glow)]">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">VeriNews</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              AI Fake News Detection
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs text-primary md:flex">
            <Sparkles className="h-3.5 w-3.5" />
            KAMALESH
          </div>
          {user ? (
            <>
              <Link to="/history">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="font-semibold">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
