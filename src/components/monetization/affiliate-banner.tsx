import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { affiliateProducts } from "@/config/monetization";

interface AffiliateBannerProps {
  category?: string;
  maxItems?: number;
}

export function AffiliateBanner({ category, maxItems = 3 }: AffiliateBannerProps) {
  const products = category
    ? affiliateProducts.filter((p) => p.category === category).slice(0, maxItems)
    : affiliateProducts.slice(0, maxItems);

  if (products.length === 0) return null;

  return (
    <Card className="bg-gray-50 border-dashed">
      <CardContent className="py-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Recommended Gear</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {products.map((product) => (
            <a
              key={product.id}
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="flex items-center gap-3 p-3 rounded-md hover:bg-white transition-colors"
            >
              <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-lg">&#128722;</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.title}</p>
                {product.price && (
                  <p className="text-sm text-blue-600 font-semibold">{product.price}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
