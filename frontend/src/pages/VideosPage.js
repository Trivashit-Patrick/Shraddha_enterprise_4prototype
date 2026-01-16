import { useEffect, useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
import { apiService } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingStates, setPlayingStates] = useState({});
  const videoRefs = useRef({});

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await apiService.getVideos();
        setVideos(res.data);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const getVideoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}${path}`;
  };

  const toggleVideo = (videoId) => {
    const video = videoRefs.current[videoId];
    if (video) {
      if (video.paused) {
        // Pause all other videos
        Object.entries(videoRefs.current).forEach(([id, v]) => {
          if (id !== videoId && v) {
            v.pause();
            setPlayingStates(prev => ({ ...prev, [id]: false }));
          }
        });
        video.play();
        setPlayingStates(prev => ({ ...prev, [videoId]: true }));
      } else {
        video.pause();
        setPlayingStates(prev => ({ ...prev, [videoId]: false }));
      }
    }
  };

  return (
    <div className="min-h-screen py-8 md:py-12" data-testid="videos-page">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-10">
          <p className="text-accent font-medium uppercase tracking-widest text-xs mb-2">
            Media Gallery
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Product Videos</h1>
          <p className="text-muted-foreground max-w-2xl">
            Watch our product demonstrations, company overview, and process videos to learn more about our offerings.
          </p>
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-lg mb-3" />
                <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div 
                key={video.id}
                className="group animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`video-item-${video.id}`}
              >
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={el => videoRefs.current[video.id] = el}
                    src={getVideoUrl(video.file_path)}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onEnded={() => setPlayingStates(prev => ({ ...prev, [video.id]: false }))}
                  />
                  
                  {/* Play/Pause Overlay */}
                  <button
                    onClick={() => toggleVideo(video.id)}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                    data-testid={`toggle-video-${video.id}`}
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      {playingStates[video.id] ? (
                        <Pause className="w-8 h-8 text-primary" />
                      ) : (
                        <Play className="w-8 h-8 text-primary ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Category Badge */}
                  {video.category && (
                    <span className="absolute top-3 left-3 px-2 py-1 bg-accent text-white text-xs font-medium rounded">
                      {video.category}
                    </span>
                  )}
                </div>

                {/* Video Info */}
                <div className="mt-4">
                  <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/50 rounded-lg">
            <div className="max-w-md mx-auto">
              <Play className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Videos Yet</h2>
              <p className="text-muted-foreground">
                Product videos will be uploaded soon. Check back later!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
