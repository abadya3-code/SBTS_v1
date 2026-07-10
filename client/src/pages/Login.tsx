/*
  SBTS Login Page — Standalone Email/Password Authentication
  Industrial Command Center Minimalism - Professional Login Interface
  Features: Email + Password login, link to register, RTL support, professional branding
*/
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Shield,
  Activity,
  Eye,
  Lock,
  EyeOff,
  Mail,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect appropriately
  useEffect(() => {
    if (!loading && user) {
      const userStatus = (user as any).userStatus;
      if (userStatus === "pending" || userStatus === "rejected") {
        setLocation("/approve");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [user, loading, setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: ({ user: loggedUser }) => {
      const status = (loggedUser as any).userStatus;
      if (status === "pending" || status === "rejected") {
        setLocation("/approve");
      } else {
        setLocation("/dashboard");
      }
    },
    onError: err => {
      const msg = err.message;
      if (msg.includes("pending")) {
        toast.error("Account under review", {
          description: "Your request is pending system administrator approval.",
        });
        setLocation("/approve");
      } else if (msg.includes("rejected")) {
        toast.error("Account rejected", {
          description:
            "Your registration request was rejected. Contact the system administrator.",
        });
      } else {
        toast.error("Sign-in failed", {
          description: "Email or password is incorrect.",
        });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    loginMutation.mutate({ email: email.trim(), password });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex overflow-hidden" dir="ltr">
      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex-col justify-between p-12">
        {/* Grid background pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-40" />

        {/* Top section */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
                SBTS
              </div>
              <div className="text-xs text-slate-500 tracking-widest">
                Smart Blind Tracking System
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            Smart Blind
            <br />
            <span className="text-cyan-400">Tracking System</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            A professional platform for managing industrial blind tracking,
            approvals, safety certificates, and project execution reports.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-4">
          {[
            {
              icon: Activity,
              label: "Real-time workflow tracking",
              desc: "Complete visibility for every blind execution phase",
            },
            {
              icon: Shield,
              label: "Role-based access control",
              desc: "Precise control over each user role and permission",
            },
            {
              icon: Eye,
              label: "Professional reports",
              desc: "Export-ready reports, certificates, and tags",
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom version info */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-xs text-slate-600 tracking-widest uppercase">
            Professional Edition v1.0
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-cyan-400" : "bg-slate-700"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Shield className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.3em] text-cyan-400">
                SBTS
              </div>
              <div className="text-xs text-slate-500">
                Smart Blind Tracking System
              </div>
            </div>
          </div>

          {/* Login card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-5 bg-cyan-400 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
                  Sign in
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">
                Welcome to SBTS
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Enter your credentials to access the command center
              </p>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    dir="ltr"
                    className="pr-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 rounded-xl"
                    required
                    autoComplete="email"
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    dir="ltr"
                    className="pr-10 pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 rounded-xl"
                    required
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending || !email.trim() || !password}
                className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm tracking-wide rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 mt-2"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Register link */}
            <div className="text-center">
              <p className="text-sm text-slate-500">
                Need an account?{" "}
                <Link
                  href="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Request access
                </Link>
              </p>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                New accounts require system administrator approval before
                activation.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-600">
              SBTS Professional &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
