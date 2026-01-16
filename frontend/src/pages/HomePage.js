import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Pause, ChevronLeft, ChevronRight, Phone, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import ProductCard from '../components/common/ProductCard';
import QueryModal from '../components/common/QueryModal';
import { apiService } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState({});
  const videoRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Seed data if needed
        await apiService.seedData().catch(() => {});
        
        const [productsRes, videosRes] = await Promise.all([
          apiService.getProducts({ featured: true }),
          apiService.getVideos(),
        ]);
        
        setFeaturedProducts(productsRes.data.slice(0, 4));
        setVideos(videosRes.data.slice(0, 4));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getVideoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}${path}`;
  };

  const toggleVideo = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (video.paused) {
        video.play();
        setIsPlaying(prev => ({ ...prev, [index]: true }));
      } else {
        video.pause();
        setIsPlaying(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const nextVideo = () => {
    setCurrentVideoIndex(prev => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex(prev => (prev - 1 + videos.length) % videos.length);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground noise-texture">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/90" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1767294274634-613a3545e36d?w=1920&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="relative container-custom py-20 md:py-32 lg:py-40">
          <div className="max-w-3xl">
            <p className="text-accent font-medium uppercase tracking-widest text-sm mb-4 animate-fade-in">
              Industrial Excellence
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 animate-fade-in-up leading-tight">
              Your Trusted Partner for
              <span className="text-accent block mt-2">Industrial Products</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl animate-fade-in-up stagger-1">
              Quality valves, pumps, pipes, and power tools for all your industrial needs. 
              Serving businesses across Maharashtra with excellence and reliability.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up stagger-2">
              <Link to="/products">
                <Button 
                  size="lg" 
                  className="bg-accent text-white hover:bg-accent/90 px-8"
                  data-testid="hero-browse-products-btn"
                >
                  Browse Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => setQueryModalOpen(true)}
                data-testid="hero-contact-btn"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <p className="text-accent font-medium uppercase tracking-widest text-xs mb-2">
                Top Picks
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">Featured Products</h2>
            </div>
            <Link to="/products">
              <Button variant="outline" data-testid="view-all-products-btn">
                View All Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-muted animate-pulse rounded-md h-[350px]" />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted rounded-lg">
              <p className="text-muted-foreground">No featured products yet.</p>
              <Link to="/products">
                <Button variant="link" className="mt-2">Browse all products</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Video Section */}
      {videos.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary/50">
          <div className="container-custom">
            <div className="text-center mb-10">
              <p className="text-accent font-medium uppercase tracking-widest text-xs mb-2">
                See It In Action
              </p>
              <h2 className="text-3xl md:text-4xl font-bold">Product Videos</h2>
            </div>

            {videos.length <= 4 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {videos.map((video, index) => (
                  <div 
                    key={video.id} 
                    className="relative bg-card rounded-lg overflow-hidden border border-border"
                    data-testid={`video-card-${video.id}`}
                  >
                    <div className="relative aspect-video">
                      <video
                        ref={el => videoRefs.current[index] = el}
                        src={getVideoUrl(video.file_path)}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onEnded={() => setIsPlaying(prev => ({ ...prev, [index]: false }))}
                      />
                      <button
                        onClick={() => toggleVideo(index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                        data-testid={`play-video-${index}`}
                      >
                        {isPlaying[index] ? (
                          <Pause className="w-12 h-12 text-white" />
                        ) : (
                          <Play className="w-12 h-12 text-white" />
                        )}
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{video.title}</h3>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevVideo}
                    className="flex-shrink-0"
                    data-testid="video-prev-btn"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex-1 overflow-hidden">
                    <div 
                      className="flex transition-transform duration-300"
                      style={{ transform: `translateX(-${currentVideoIndex * 100}%)` }}
                    >
                      {videos.map((video, index) => (
                        <div 
                          key={video.id} 
                          className="w-full flex-shrink-0 px-2"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden">
                            <video
                              ref={el => videoRefs.current[index] = el}
                              src={getVideoUrl(video.file_path)}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                            />
                            <button
                              onClick={() => toggleVideo(index)}
                              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                            >
                              {isPlaying[index] ? (
                                <Pause className="w-16 h-16 text-white" />
                              ) : (
                                <Play className="w-16 h-16 text-white" />
                              )}
                            </button>
                          </div>
                          <h3 className="font-semibold text-center mt-4">{video.title}</h3>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextVideo}
                    className="flex-shrink-0"
                    data-testid="video-next-btn"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Dots indicator */}
                <div className="flex justify-center gap-2 mt-6">
                  {videos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentVideoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentVideoIndex ? 'bg-accent' : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="text-center mt-8">
              <Link to="/videos">
                <Button variant="outline" data-testid="view-all-videos-btn">
                  View All Videos
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <div className="relative overflow-hidden bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 lg:p-16">
            <div className="absolute inset-0 opacity-10">
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1631856956334-35db20cb7748?w=1200&q=80')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
            
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Need Help Finding the Right Product?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8">
                Our team of experts is ready to assist you with product selection, 
                technical specifications, and bulk order inquiries.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg"
                  className="bg-accent text-white hover:bg-accent/90"
                  onClick={() => setQueryModalOpen(true)}
                  data-testid="cta-contact-btn"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Send Inquiry
                </Button>
                <a href="tel:+919876543210" className="md:hidden">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call Now
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QueryModal open={queryModalOpen} onOpenChange={setQueryModalOpen} />
    </div>
  );
}
