import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Package, 
  Video, 
  MessageSquare, 
  FolderTree, 
  Plus, 
  Trash2, 
  Edit, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  Eye,
  Loader2,
  Upload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { admin, logout, isAuthenticated } = useAuth();
  
  const [activeTab, setActiveTab] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [videos, setVideos] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form states
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
      return;
    }
    fetchAllData();
  }, [isAuthenticated, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, subcategoriesRes, videosRes, queriesRes] = await Promise.all([
        apiService.getProducts(),
        apiService.getCategories(),
        apiService.getSubcategories(),
        apiService.getVideos(),
        apiService.getQueries(),
      ]);
      
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);
      setVideos(videosRes.data);
      setQueries(queriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BACKEND_URL}${path}`;
  };

  // Product handlers
  const handleCreateProduct = async (formData) => {
    setFormLoading(true);
    try {
      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, formData);
      } else {
        await apiService.createProduct(formData);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      fetchAllData();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiService.deleteProduct(id);
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  // Category handlers
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setFormLoading(true);
    try {
      await apiService.createCategory({
        name: formData.get('name'),
        description: formData.get('description'),
      });
      setCategoryModalOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Failed to create category:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure? This will also delete all subcategories.')) return;
    try {
      await apiService.deleteCategory(id);
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  // Subcategory handlers
  const handleCreateSubcategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setFormLoading(true);
    try {
      await apiService.createSubcategory({
        name: formData.get('name'),
        category_id: formData.get('category_id'),
        description: formData.get('description'),
      });
      setSubcategoryModalOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Failed to create subcategory:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    try {
      await apiService.deleteSubcategory(id);
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete subcategory:', error);
    }
  };

  // Video handlers
  const handleCreateVideo = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setFormLoading(true);
    try {
      await apiService.createVideo(formData);
      setVideoModalOpen(false);
      fetchAllData();
    } catch (error) {
      console.error('Failed to upload video:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await apiService.deleteVideo(id);
      fetchAllData();
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
  };

  const sidebarItems = [
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'categories', label: 'Categories', icon: FolderTree, count: categories.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'queries', label: 'Queries', icon: MessageSquare, count: queries.length },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-muted rounded-md"
              data-testid="mobile-sidebar-toggle"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold">Admin Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-border">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SE</span>
                </div>
                <span className="font-bold">Admin</span>
              </Link>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-muted rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors
                    ${activeTab === item.id 
                      ? 'bg-accent text-white' 
                      : 'hover:bg-muted text-foreground'
                    }
                  `}
                  data-testid={`sidebar-${item.id}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <Badge variant={activeTab === item.id ? 'secondary' : 'outline'} className="text-xs">
                    {item.count}
                  </Badge>
                </button>
              ))}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <span className="font-medium">{admin?.name?.[0] || 'A'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{admin?.name || 'Admin'}</p>
                  <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 min-h-screen">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Products</h1>
                    <Button 
                      onClick={() => { setEditingProduct(null); setProductModalOpen(true); }}
                      className="bg-accent text-white hover:bg-accent/90"
                      data-testid="add-product-btn"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>

                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Image</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                            <TableCell>
                              <img 
                                src={getImageUrl(product.images?.[0])} 
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>
                              {product.category_name}
                              {product.subcategory_name && (
                                <span className="text-muted-foreground"> / {product.subcategory_name}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {product.is_featured && <Badge className="bg-accent">Featured</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/products/${product.id}`} target="_blank">
                                  <Button variant="ghost" size="icon">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => { setEditingProduct(product); setProductModalOpen(true); }}
                                  data-testid={`edit-product-${product.id}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  data-testid={`delete-product-${product.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {products.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No products yet. Add your first product!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div>
                  <Tabs defaultValue="categories" className="w-full">
                    <div className="flex items-center justify-between mb-6">
                      <TabsList>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                        <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="categories">
                      <div className="flex justify-end mb-4">
                        <Button 
                          onClick={() => setCategoryModalOpen(true)}
                          className="bg-accent text-white hover:bg-accent/90"
                          data-testid="add-category-btn"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Category
                        </Button>
                      </div>
                      <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Subcategories</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categories.map((category) => (
                              <TableRow key={category.id}>
                                <TableCell className="font-medium">{category.name}</TableCell>
                                <TableCell className="text-muted-foreground">{category.description || '-'}</TableCell>
                                <TableCell>
                                  {subcategories.filter(s => s.category_id === category.id).length}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive"
                                    onClick={() => handleDeleteCategory(category.id)}
                                    data-testid={`delete-category-${category.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>

                    <TabsContent value="subcategories">
                      <div className="flex justify-end mb-4">
                        <Button 
                          onClick={() => setSubcategoryModalOpen(true)}
                          className="bg-accent text-white hover:bg-accent/90"
                          data-testid="add-subcategory-btn"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subcategory
                        </Button>
                      </div>
                      <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Parent Category</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {subcategories.map((subcategory) => (
                              <TableRow key={subcategory.id}>
                                <TableCell className="font-medium">{subcategory.name}</TableCell>
                                <TableCell>
                                  {categories.find(c => c.id === subcategory.category_id)?.name || '-'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">{subcategory.description || '-'}</TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive"
                                    onClick={() => handleDeleteSubcategory(subcategory.id)}
                                    data-testid={`delete-subcategory-${subcategory.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Videos Tab */}
              {activeTab === 'videos' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Videos</h1>
                    <Button 
                      onClick={() => setVideoModalOpen(true)}
                      className="bg-accent text-white hover:bg-accent/90"
                      data-testid="add-video-btn"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <div key={video.id} className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          <video 
                            src={getImageUrl(video.file_path)} 
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold">{video.title}</h3>
                          {video.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {video.description}
                            </p>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive mt-2"
                            onClick={() => handleDeleteVideo(video.id)}
                            data-testid={`delete-video-${video.id}`}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                    {videos.length === 0 && (
                      <div className="col-span-full text-center py-12 bg-muted/50 rounded-lg">
                        <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No videos uploaded yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Queries Tab */}
              {activeTab === 'queries' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Customer Queries</h1>
                  </div>

                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {queries.map((query) => (
                          <TableRow key={query.id} data-testid={`query-row-${query.id}`}>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(query.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-medium">{query.name}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{query.email}</p>
                                <p className="text-muted-foreground">{query.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell>{query.product_name}</TableCell>
                            <TableCell>
                              <Badge variant={query.status === 'pending' ? 'secondary' : 'default'}>
                                {query.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {queries.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No queries yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Product Modal */}
      <ProductModal
        open={productModalOpen}
        onOpenChange={setProductModalOpen}
        product={editingProduct}
        categories={categories}
        subcategories={subcategories}
        onSubmit={handleCreateProduct}
        loading={formLoading}
      />

      {/* Category Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a new product category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input id="cat-name" name="name" required data-testid="category-name-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea id="cat-desc" name="description" rows={3} />
            </div>
            <Button type="submit" className="w-full bg-accent text-white" disabled={formLoading} data-testid="create-category-btn">
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Category
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory Modal */}
      <Dialog open={subcategoryModalOpen} onOpenChange={setSubcategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subcategory</DialogTitle>
            <DialogDescription>Create a new subcategory under a category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubcategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subcat-parent">Parent Category *</Label>
              <select 
                id="subcat-parent" 
                name="category_id" 
                required 
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                data-testid="subcategory-parent-select"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcat-name">Name *</Label>
              <Input id="subcat-name" name="name" required data-testid="subcategory-name-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcat-desc">Description</Label>
              <Textarea id="subcat-desc" name="description" rows={3} />
            </div>
            <Button type="submit" className="w-full bg-accent text-white" disabled={formLoading} data-testid="create-subcategory-btn">
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Subcategory
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>Add a new video to your gallery.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateVideo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video-file">Video File *</Label>
              <Input id="video-file" name="video" type="file" accept="video/*" required data-testid="video-file-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-title">Title *</Label>
              <Input id="video-title" name="title" required data-testid="video-title-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-desc">Description</Label>
              <Textarea id="video-desc" name="description" rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-category">Category</Label>
              <Input id="video-category" name="category" placeholder="e.g., Product Demo, Company Overview" />
            </div>
            <Button type="submit" className="w-full bg-accent text-white" disabled={formLoading} data-testid="upload-video-btn">
              {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload Video
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Modal Component
function ProductModal({ open, onOpenChange, product, categories, subcategories, onSubmit, loading }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (product) {
      setSelectedCategory(product.category_id);
      setExistingImages(product.images || []);
    } else {
      setSelectedCategory('');
      setExistingImages([]);
    }
    setSelectedImages([]);
  }, [product, open]);

  const filteredSubcategories = subcategories.filter(s => s.category_id === selectedCategory);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();
    
    formData.append('name', form.name.value);
    formData.append('category_id', form.category_id.value);
    formData.append('description', form.description.value);
    formData.append('subcategory_id', form.subcategory_id?.value || '');
    formData.append('is_featured', form.is_featured.checked);
    formData.append('existing_images', JSON.stringify(existingImages));
    
    // Add new images
    selectedImages.forEach(file => {
      formData.append('images', file);
    });
    
    onSubmit(formData);
  };

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the product details.' : 'Add a new product to your catalog.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prod-name">Product Name *</Label>
            <Input 
              id="prod-name" 
              name="name" 
              defaultValue={product?.name} 
              required 
              data-testid="product-name-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prod-cat">Category *</Label>
              <select 
                id="prod-cat" 
                name="category_id" 
                required 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                data-testid="product-category-select"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prod-subcat">Subcategory</Label>
              <select 
                id="prod-subcat" 
                name="subcategory_id"
                defaultValue={product?.subcategory_id || ''}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                data-testid="product-subcategory-select"
              >
                <option value="">Select Subcategory</option>
                {filteredSubcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prod-desc">Description *</Label>
            <Textarea 
              id="prod-desc" 
              name="description" 
              defaultValue={product?.description}
              rows={4} 
              required 
              data-testid="product-description-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Product Images</Label>
            
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} 
                      alt={`Product ${index + 1}`}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <Input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={(e) => setSelectedImages(Array.from(e.target.files))}
              data-testid="product-images-input"
            />
            <p className="text-xs text-muted-foreground">
              You can select multiple images. First image will be the main image.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="prod-featured" name="is_featured" defaultChecked={product?.is_featured} />
            <Label htmlFor="prod-featured">Featured Product</Label>
          </div>

          <Button type="submit" className="w-full bg-accent text-white" disabled={loading} data-testid="save-product-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
