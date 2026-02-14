import Link from "next/link";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600">&#9918;</span>
              <span className="text-xl font-bold">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 text-sm text-gray-600 max-w-md">
              {siteConfig.description}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Coverage</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/wbc" className="text-sm text-gray-600 hover:text-gray-900">World Baseball Classic</Link></li>
              <li><Link href="/wbc/schedule" className="text-sm text-gray-600 hover:text-gray-900">Schedule</Link></li>
              <li><Link href="/wbc/standings" className="text-sm text-gray-600 hover:text-gray-900">Standings</Link></li>
              <li><Link href="/wbc/teams" className="text-sm text-gray-600 hover:text-gray-900">Teams</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">More</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900">Blog</Link></li>
              <li><Link href="/about" className="text-sm text-gray-600 hover:text-gray-900">About</Link></li>
              <li><Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved. Not affiliated with MLB or WBSC.
          </p>
        </div>
      </div>
    </footer>
  );
}
