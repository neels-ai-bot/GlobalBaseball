import Link from "next/link";
import { navItems, siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold text-blue-600">&#9918;</span>
          <span className="text-xl font-bold">{siteConfig.name}</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <MobileNav />
      </div>
    </header>
  );
}

function MobileNav() {
  return (
    <div className="md:hidden">
      <details className="group relative">
        <summary className="flex h-10 w-10 items-center justify-center rounded-md hover:bg-gray-100 cursor-pointer list-none">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </summary>
        <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
