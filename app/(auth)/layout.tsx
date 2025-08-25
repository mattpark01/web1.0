import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Spatiolabs",
  description: "Sign in or create your Spatiolabs account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}