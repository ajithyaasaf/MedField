import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  Search,
  Filter,
  X,
  File,
  FileImage,
  FileVideo,
  Paperclip,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DocumentManagerProps {
  onClose: () => void;
  quotationId?: number;
  hospitalId?: number;
}

interface Document {
  id: number;
  name: string;
  type: string;
  size: number;
  category: 'contract' | 'approval' | 'certificate' | 'quote' | 'receipt' | 'other';
  uploadedBy: string;
  uploadedAt: Date;
  quotationId?: number;
  hospitalId?: number;
  url: string;
  tags: string[];
}

export default function DocumentManager({ onClose, quotationId, hospitalId }: DocumentManagerProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('other');
  const [uploadTags, setUploadTags] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['/api/documents', quotationId, hospitalId],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/documents/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Uploaded',
        description: 'Your document has been uploaded successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedFile(null);
      setUploadTags('');
    },
    onError: (error: any) => {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest('DELETE', `/api/documents/${documentId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Document Deleted',
        description: 'The document has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete document',
        variant: 'destructive',
      });
    },
  });

  // Mock data for demonstration
  const mockDocuments: Document[] = [
    {
      id: 1,
      name: 'Hospital_Approval_Letter.pdf',
      type: 'application/pdf',
      size: 245760,
      category: 'approval',
      uploadedBy: 'Sarah Johnson',
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      hospitalId: 1,
      url: '#',
      tags: ['approval', 'signed', 'urgent']
    },
    {
      id: 2,
      name: 'Signed_Contract_2024.pdf',
      type: 'application/pdf',
      size: 512000,
      category: 'contract',
      uploadedBy: 'Mike Chen',
      uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      quotationId: 1,
      url: '#',
      tags: ['contract', 'signed', 'legal']
    },
    {
      id: 3,
      name: 'Equipment_Certificate.jpg',
      type: 'image/jpeg',
      size: 1024000,
      category: 'certificate',
      uploadedBy: 'Anna Martinez',
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      url: '#',
      tags: ['certificate', 'quality', 'iso']
    },
  ];

  const documentData = documents || mockDocuments;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Please select a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', uploadCategory);
      formData.append('tags', uploadTags);
      if (quotationId) formData.append('quotationId', quotationId.toString());
      if (hospitalId) formData.append('hospitalId', hospitalId.toString());

      await uploadMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (document: Document) => {
    // In a real app, this would download from the server
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download Started',
      description: `Downloading ${document.name}`,
    });
  };

  const handleDelete = (documentId: number) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      deleteMutation.mutate(documentId);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type.startsWith('video/')) return <FileVideo className="h-5 w-5 text-purple-500" />;
    if (type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract': return 'bg-blue-100 text-blue-800';
      case 'approval': return 'bg-green-100 text-green-800';
      case 'certificate': return 'bg-yellow-100 text-yellow-800';
      case 'quote': return 'bg-purple-100 text-purple-800';
      case 'receipt': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documentData.filter((doc: Document) => {
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'contract', label: 'Contracts' },
    { value: 'approval', label: 'Approvals' },
    { value: 'certificate', label: 'Certificates' },
    { value: 'quote', label: 'Quotations' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <FolderOpen className="h-6 w-6 text-medical-blue" />
              <span>Document Management</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Document</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    placeholder="urgent, signed, legal"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-medical-blue hover:bg-medical-blue-dark"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-pulse" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Documents Found</h3>
                <p className="text-gray-500">
                  {documentData.length === 0 
                    ? "No documents have been uploaded yet."
                    : "No documents match your current filters."
                  }
                </p>
              </div>
            ) : (
              filteredDocuments.map((document: Document) => (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="bg-gray-50 p-2 rounded-lg">
                          {getFileIcon(document.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-medical-gray-dark truncate">
                            {document.name}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{formatFileSize(document.size)}</span>
                            <span>•</span>
                            <span>by {document.uploadedBy}</span>
                            <span>•</span>
                            <span>{format(document.uploadedAt, 'MMM d, yyyy')}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className={getCategoryColor(document.category)}>
                              {document.category}
                            </Badge>
                            {document.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.url, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(document.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}