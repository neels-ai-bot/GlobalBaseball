"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NewsletterCtaProps {
  variant?: "inline" | "banner";
  className?: string;
}

export function NewsletterCta({ variant = "banner", className }: NewsletterCtaProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Thanks for subscribing! Check your inbox.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (variant === "inline") {
    return (
      <div className={className}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "..." : "Subscribe"}
          </Button>
        </form>
        {message && (
          <p className={`text-sm mt-2 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-blue-600 text-white border-0 ${className}`}>
      <CardContent className="py-8 text-center">
        <h3 className="text-xl font-bold mb-2">Stay in the Game</h3>
        <p className="text-blue-100 mb-6 max-w-md mx-auto">
          Get daily recaps, tournament updates, and expert analysis delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1 rounded-md px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
          />
          <Button type="submit" disabled={status === "loading"} className="bg-white text-blue-700 hover:bg-blue-50">
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
        {message && (
          <p className={`text-sm mt-3 ${status === "success" ? "text-blue-200" : "text-red-300"}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
