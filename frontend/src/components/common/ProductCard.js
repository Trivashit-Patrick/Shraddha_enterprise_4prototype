import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import QueryModal from './QueryModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const ProductCard = ({ product }) => {
  const [queryModalOpen, setQueryModalOpen] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/400x300?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
  };

  return (
    <>
      <div 
        className="product-card group bg-card border border-border rounded-md overflow-hidden"
        data-testid={`product-card-${product.id}`}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={getImageUrl(product.images?.[0])}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {product.is_featured && (
            <Badge 
              className="absolute top-3 left-3 bg-accent text-white"
              data-testid="featured-badge"
            >
              Featured
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category Label */}
          {product.category_name && (
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
              {product.category_name}
              {product.subcategory_name && ` / ${product.subcategory_name}`}
            </p>
          )}

          {/* Product Name */}
          <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {product.description}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <Link to={`/products/${product.id}`} className="flex-1">
              <Button 
                variant="outline" 
                className="w-full"
                data-testid={`view-product-${product.id}`}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
            </Link>
            <Button
              onClick={() => setQueryModalOpen(true)}
              className="flex-1 bg-accent text-white hover:bg-accent/90"
              data-testid={`query-product-${product.id}`}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Query
            </Button>
          </div>
        </div>
      </div>

      <QueryModal 
        open={queryModalOpen} 
        onOpenChange={setQueryModalOpen}
        product={product}
      />
    </>
  );
};

export default ProductCard;
