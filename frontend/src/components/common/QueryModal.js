import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { apiService } from '../../lib/api';

export const QueryModal = ({ 
  open, 
  onOpenChange, 
  product = null 
}) => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (data) => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const queryData = {
        ...data,
        product_name: product?.name || 'General Inquiry',
        product_id: product?.id || null,
      };
      
      await apiService.submitQuery(queryData);
      setStatus('success');
      reset();
      
      // Auto close after success
      setTimeout(() => {
        onOpenChange(false);
        setStatus('idle');
      }, 2500);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Failed to submit query. Please try again.');
    }
  };

  const handleClose = (open) => {
    if (!open) {
      setStatus('idle');
      setErrorMessage('');
      reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" data-testid="query-modal">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {product ? 'Product Inquiry' : 'Contact Us'}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? `Send us a query about ${product.name}`
              : 'Send us your inquiry and we\'ll get back to you shortly.'
            }
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Query Submitted!</h3>
            <p className="text-muted-foreground text-sm">
              We got your request and will get back to you shortly.
            </p>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="w-16 h-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Submission Failed</h3>
            <p className="text-muted-foreground text-sm mb-4">{errorMessage}</p>
            <Button onClick={() => setStatus('idle')} variant="outline">
              Try Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {product && (
              <div className="space-y-2">
                <Label>Product</Label>
                <Input 
                  value={product.name} 
                  disabled 
                  className="bg-muted"
                  data-testid="query-product-name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Your full name"
                data-testid="query-name-input"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                data-testid="query-email-input"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                data-testid="query-phone-input"
                {...register('phone', {
                  required: 'Phone number is required',
                  minLength: { value: 10, message: 'Phone number must be at least 10 digits' },
                })}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Any specific requirements or questions..."
                rows={3}
                data-testid="query-message-input"
                {...register('message')}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-accent text-white hover:bg-accent/90"
              disabled={status === 'loading'}
              data-testid="query-submit-btn"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Send Query'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QueryModal;
