import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Filter, 
  Search, 
  Eye, 
  Copy, 
  Send, 
  Download,
  X,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { generateQuotationPDF } from '@/lib/pdf-generator';

interface QuotationListProps {
  onClose: () => void;
  onCreateNew: () => void;
}

export default function QuotationList({ onClose, onCreateNew }: QuotationListProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: quotations, isLoading } = useQuery({
    queryKey: ['/api/quotations'],
  });

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  const resendQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await apiRequest('POST', `/api/quotations/${quotationId}/resend`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Quotation Resent',
        description: 'The quotation has been resent successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to resend quotation',
        variant: 'destructive',
      });
    },
  });

  const cloneQuotationMutation = useMutation({
    mutationFn: async (quotationId: number) => {
      const response = await apiRequest('POST', `/api/quotations/${quotationId}/clone`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Quotation Cloned',
        description: 'A new quotation has been created based on the selected one.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clone quotation',
        variant: 'destructive',
      });
    },
  });

  const handleDownloadPDF = async (quotation: any) => {
    try {
      const hospital = hospitals?.find((h: any) => h.id === quotation.hospitalId);
      
      const pdfData = {
        quotationNumber: quotation.quotationNumber,
        hospital: {
          name: hospital?.name || 'Unknown Hospital',
          address: hospital?.address || '',
          contactPerson: hospital?.contactPerson || '',
          contactEmail: hospital?.contactEmail || '',
          contactPhone: hospital?.contactPhone || '',
        },
        products: quotation.products || [],
        subtotal: parseFloat(quotation.subtotalAmount || '0'),
        discountAmount: parseFloat(quotation.discountAmount || '0'),
        total: parseFloat(quotation.totalAmount || '0'),
        notes: quotation.notes || '',
        createdAt: new Date(quotation.createdAt),
      };

      await generateQuotationPDF(pdfData);
      
      toast({
        title: 'PDF Downloaded',
        description: 'The quotation PDF has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter quotations
  const filteredQuotations = quotations?.filter((quotation: any) => {
    const hospital = hospitals?.find((h: any) => h.id === quotation.hospitalId);
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesSearch = !searchTerm || 
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hospital?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-medical-amber bg-opacity-20 text-yellow-800';
      case 'accepted': return 'bg-medical-green bg-opacity-20 text-green-800';
      case 'rejected': return 'bg-medical-red bg-opacity-20 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-medical-blue" />
            <p>Loading quotations...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-6 w-6 text-medical-blue" />
              <span>My Quotations</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={onCreateNew} className="bg-medical-blue hover:bg-medical-blue-dark">
                <FileText className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex space-x-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredQuotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Quotations Found</h3>
              <p className="text-gray-500 mb-4">
                {quotations?.length === 0 
                  ? "You haven't created any quotations yet."
                  : "No quotations match your current filters."
                }
              </p>
              <Button onClick={onCreateNew} className="bg-medical-blue hover:bg-medical-blue-dark">
                Create Your First Quotation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredQuotations.map((quotation: any) => {
                const hospital = hospitals?.find((h: any) => h.id === quotation.hospitalId);
                return (
                  <div key={quotation.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-medical-gray-dark">
                          {quotation.quotationNumber}
                        </h3>
                        <p className="text-medical-gray">{hospital?.name}</p>
                        <p className="text-sm text-gray-500">
                          Created {format(new Date(quotation.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(quotation.status)}>
                          {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
                        </Badge>
                        <p className="text-xl font-bold text-medical-gray-dark mt-2">
                          ${parseFloat(quotation.totalAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    {quotation.notes && (
                      <p className="text-sm text-gray-600 mb-4">{quotation.notes}</p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPDF(quotation)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                      
                      {quotation.status === 'sent' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendQuotationMutation.mutate(quotation.id)}
                          disabled={resendQuotationMutation.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Resend
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cloneQuotationMutation.mutate(quotation.id)}
                        disabled={cloneQuotationMutation.isPending}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Clone
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement view/edit functionality
                          toast({
                            title: 'Coming Soon',
                            description: 'Quotation editing will be available soon.',
                          });
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}