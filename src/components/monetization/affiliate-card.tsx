import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AffiliateProduct } from "@/config/monetization";

interface AffiliateCardProps {
  product: AffiliateProduct;
}

export function AffiliateCard({ product }: AffiliateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="aspect-square bg-gray-100 rounded-md mb-4 flex items-center justify-center">
          <span className="text-4xl text-gray-300">&#128722;</span>
        </div>
        <h3 className="font-semibold mb-1">{product.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>
        {product.price && (
          <p className="text-lg font-bold text-blue-600 mb-3">{product.price}</p>
        )}
        <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer nofollow">
          <Button className="w-full" size="sm">
            View on Amazon
          </Button>
        </a>
        <p className="text-xs text-gray-400 mt-2 text-center">Affiliate link</p>
      </CardContent>
    </Card>
  );
}
