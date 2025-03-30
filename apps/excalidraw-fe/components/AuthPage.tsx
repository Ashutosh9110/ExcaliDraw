"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeToggle } from "./ThemeProvider";
import { User, LucideLogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuth } from "./AuthContext";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { login, signup, isAuthenticated } = useAuth();

    // Redirect to canvas if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/canvas");
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isSignin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            
            // Redirect to canvas page after successful auth
            router.push("/canvas");
        } catch {
            setError(isSignin ? "Login failed. Please try again." : "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col bg-background">
            <header className="w-full p-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                    <ArrowLeft size={18} />
                    <span>Back to home</span>
                </Link>
                <ThemeToggle />
            </header>
            
            <div className="flex-1 flex justify-center items-center">
                <div className="w-full max-w-md p-8 m-2 bg-card rounded-xl shadow-lg border border-border">
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                            {isSignin ? <LucideLogIn className="h-8 w-8 text-primary" /> : <User className="h-8 w-8 text-primary" />}
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">{isSignin ? "Sign In" : "Create Account"}</h1>
                        <p className="text-muted-foreground mt-2">
                            {isSignin ? "Welcome back! Please sign in to continue." : "Sign up to start creating beautiful diagrams."}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-foreground">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        className="w-full pl-10 p-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full pl-10 p-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full p-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
                            >
                                {loading ? "Processing..." : isSignin ? "Sign In" : "Sign Up"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        {isSignin ? (
                            <p className="text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link href="/signup" className="text-primary hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        ) : (
                            <p className="text-muted-foreground">
                                Already have an account?{" "}
                                <Link href="/signin" className="text-primary hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}