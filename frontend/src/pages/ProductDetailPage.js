import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import QueryModal from '../components/common/QueryModal';
import { apiService } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [queryModalOpen, setQueryModalOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await apiService.getProduct(id);
        setProduct(res.data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/800x600?text=No+Image';
    if (imagePath.startsWith('http')) return imagePath;
    return `${BACKEND_URL}${imagePath}`;
  };

  const nextImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImageIndex(prev => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImageIndex(prev => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-[4/3] bg-muted rounded-lg" />
              <div className="space-y-4">
                <div className="h-6 w-24 bg-muted rounded" />
                <div className="h-10 w-3/4 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen py-8">
        <div className="container-custom">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link to="/products">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [''];

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="product-detail-page">
      <div className="container-custom">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link 
            to="/products" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
            data-testid="back-to-products"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
              <img
                src={getImageUrl(images[selectedImageIndex])}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="main-product-image"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                    data-testid="prev-image-btn"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                    data-testid="next-image-btn"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {product.is_featured && (
                <Badge className="absolute top-4 left-4 bg-accent text-white">
                  Featured
                </Badge>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex
                        ? 'border-accent'
                        : 'border-transparent hover:border-muted-foreground/50'
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            <div className="flex flex-wrap gap-2">
              {product.category_name && (
                <Badge variant="secondary" className="uppercase tracking-wide text-xs">
                  {product.category_name}
                </Badge>
              )}
              {product.subcategory_name && (
                <Badge variant="outline" className="uppercase tracking-wide text-xs">
                  {product.subcategory_name}
                </Badge>
              )}
            </div>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-bold" data-testid="product-name">
              {product.name}
            </h1>

            {/* Description */}
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-muted-foreground text-lg leading-relaxed" data-testid="product-description">
                {product.description}
              </p>
            </div>

            {/* CTA */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Interested in this product? Send us a query and we'll get back to you with pricing and availability.
              </p>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 px-8"
                onClick={() => setQueryModalOpen(true)}
                data-testid="send-query-btn"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Send Query
              </Button>
            </div>

            {/* Additional Info */}
            <div className="bg-secondary/50 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our team for technical specifications, bulk pricing, or any other inquiries.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <a 
                  href="tel:+919876543210" 
                  className="text-accent hover:underline"
                >
                  +91 98765 43210
                </a>
                <a 
                  href="mailto:info@shraddhaenterprises.com" 
                  className="text-accent hover:underline"
                >
                  info@shraddhaenterprises.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QueryModal 
        open={queryModalOpen} 
        onOpenChange={setQueryModalOpen}
        product={product}
      />
    </div>
  );
}
