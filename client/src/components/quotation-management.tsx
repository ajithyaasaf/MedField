import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Send, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Edit,
  Trash2,
  Mail,
  AlertCircle,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuotationManagementProps {
  onClose: () => void;
}

interface Template {
  id: number;
  name: string;
  category: string;
  products: Array<{
    id: number;
    quantity: number;
    unitPrice: string;
    discount?: number;
  }>;
  standardDiscount: number;
  validityDays: number;
  terms: string;
}

export default function QuotationManagement({ onClose }: QuotationManagementProps) {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedQuotations, setSelectedQuotations] = useState<number[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState<any>(null);
  const { toast } = useToast();

  const { data: quotations, refetch } = useQuery({
    queryKey: ['/api/quotations'],
  });

  const { data: templates } = useQuery({
    queryKey: ['/api/quotation-templates'],
  });

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  // Bulk PDF Export
  const bulkExportMutation = useMutation({
    mutationFn: async (quotationIds: number[]) => {
      const response = await apiRequest("POST", "/api/quotations/bulk-export", { quotationIds });
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quotations-export-${format(new Date(), 'yyyy-MM-dd')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Successful",
        description: `${selectedQuotations.length} quotations exported successfully.`,
      });
      setSelectedQuotations([]);
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export quotations",
        variant: "destructive",
      });
    },
  });

  // Approval Workflow
  const approvalMutation = useMutation({
    mutationFn: async ({ quotationId, action, comments }: { quotationId: number; action: string; comments?: string }) => {
      const response = await apiRequest("POST", `/api/quotations/${quotationId}/approval`, { action, comments });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Approval Updated",
        description: "Quotation approval status updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotations'] });
      setShowApprovalWorkflow(false);
      setCurrentQuotation(null);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to update approval status",
        variant: "destructive",
      });
    },
  });

  // Send Reminder
  const reminderMutation = useMutation({
    mutationFn: async (quotationIds: number[]) => {
      const response = await apiRequest("POST", "/api/quotations/send-reminders", { quotationIds });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminders Sent",
        description: `Reminders sent for ${selectedQuotations.length} quotations.`,
      });
      setSelectedQuotations([]);
    },
    onError: (error: any) => {
      toast({
        title: "Reminder Failed",
        description: error.message || "Failed to send reminders",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredQuotations = quotations?.filter((q: any) => {
    if (activeTab === 'all') return true;
    return q.status === activeTab;
  }) || [];

  const handleQuotationSelect = (quotationId: number, checked: boolean) => {
    if (checked) {
      setSelectedQuotations([...selectedQuotations, quotationId]);
    } else {
      setSelectedQuotations(selectedQuotations.filter(id => id !== quotationId));
    }
  };

  const handleSelectAll = () => {
    if (selectedQuotations.length === filteredQuotations.length) {
      setSelectedQuotations([]);
    } else {
      setSelectedQuotations(filteredQuotations.map((q: any) => q.id));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-medical-blue" />
            Advanced Quotation Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedQuotations.length === filteredQuotations.length && filteredQuotations.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {selectedQuotations.length} of {filteredQuotations.length} selected
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateManager(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Templates
              </Button>
              
              {selectedQuotations.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => bulkExportMutation.mutate(selectedQuotations)}
                    disabled={bulkExportMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export PDF
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reminderMutation.mutate(selectedQuotations)}
                    disabled={reminderMutation.isPending}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Send Reminders
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quotations Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({quotations?.length || 0})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({quotations?.filter((q: any) => q.status === 'pending').length || 0})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({quotations?.filter((q: any) => q.status === 'sent').length || 0})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({quotations?.filter((q: any) => q.status === 'approved').length || 0})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({quotations?.filter((q: any) => q.status === 'rejected').length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {filteredQuotations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quotations found for this status</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuotations.map((quotation: any) => {
                    const hospital = hospitals?.find((h: any) => h.id === quotation.hospitalId);
                    return (
                      <Card key={quotation.id} className="border-l-4 border-l-medical-blue">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={selectedQuotations.includes(quotation.id)}
                                onCheckedChange={(checked) => handleQuotationSelect(quotation.id, checked as boolean)}
                              />
                              <div>
                                <h3 className="font-medium text-gray-900">{quotation.quotationNumber}</h3>
                                <p className="text-sm text-gray-600">{hospital?.name}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(quotation.status)}>
                                {getStatusIcon(quotation.status)}
                                <span className="ml-1 capitalize">{quotation.status}</span>
                              </Badge>
                              <span className="text-lg font-semibold text-medical-blue">
                                ${quotation.totalAmount}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <p className="font-medium">{format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Products:</span>
                              <p className="font-medium">{quotation.products.length} items</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Discount:</span>
                              <p className="font-medium">{quotation.discountPercent || 0}%</p>
                            </div>
                            <div className="flex space-x-2">
                              {quotation.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCurrentQuotation(quotation);
                                    setShowApprovalWorkflow(true);
                                  }}
                                >
                                  Review
                                </Button>
                              )}
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Template Manager Modal */}
        {showTemplateManager && (
          <TemplateManager
            onClose={() => setShowTemplateManager(false)}
            templates={templates || []}
          />
        )}

        {/* Approval Workflow Modal */}
        {showApprovalWorkflow && currentQuotation && (
          <ApprovalWorkflow
            quotation={currentQuotation}
            onClose={() => {
              setShowApprovalWorkflow(false);
              setCurrentQuotation(null);
            }}
            onApprove={(comments) => approvalMutation.mutate({ 
              quotationId: currentQuotation.id, 
              action: 'approve', 
              comments 
            })}
            onReject={(comments) => approvalMutation.mutate({ 
              quotationId: currentQuotation.id, 
              action: 'reject', 
              comments 
            })}
            onRequestChanges={(comments) => approvalMutation.mutate({ 
              quotationId: currentQuotation.id, 
              action: 'request_changes', 
              comments 
            })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Template Manager Component
function TemplateManager({ onClose, templates }: { onClose: () => void; templates: Template[] }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const response = await apiRequest("POST", "/api/quotation-templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template Created",
        description: "Quotation template created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotation-templates'] });
      setShowCreateForm(false);
    },
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Quotation Templates</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Manage reusable quotation templates for faster quote generation.</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates created yet</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{template.category}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{template.products.length} products</span>
                          <span>{template.standardDiscount}% discount</span>
                          <span>{template.validityDays} days validity</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Approval Workflow Component
function ApprovalWorkflow({ 
  quotation, 
  onClose, 
  onApprove, 
  onReject, 
  onRequestChanges 
}: { 
  quotation: any; 
  onClose: () => void; 
  onApprove: (comments: string) => void;
  onReject: (comments: string) => void;
  onRequestChanges: (comments: string) => void;
}) {
  const [comments, setComments] = useState("");
  const [action, setAction] = useState<string>("");

  const handleSubmit = () => {
    if (!action) return;
    
    switch (action) {
      case 'approve':
        onApprove(comments);
        break;
      case 'reject':
        onReject(comments);
        break;
      case 'request_changes':
        onRequestChanges(comments);
        break;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quotation Approval Workflow</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Quotation Summary */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">{quotation.quotationNumber}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Amount:</span>
                  <p className="font-medium">${quotation.totalAmount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Products:</span>
                  <p className="font-medium">{quotation.products.length} items</p>
                </div>
                <div>
                  <span className="text-gray-500">Discount:</span>
                  <p className="font-medium">{quotation.discountPercent || 0}%</p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium">{format(new Date(quotation.createdAt), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Selection */}
          <div className="space-y-4">
            <Label>Approval Decision</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={action === 'approve' ? 'default' : 'outline'}
                onClick={() => setAction('approve')}
                className="h-16 flex-col"
              >
                <CheckCircle className="h-6 w-6 mb-1" />
                Approve
              </Button>
              <Button
                variant={action === 'request_changes' ? 'default' : 'outline'}
                onClick={() => setAction('request_changes')}
                className="h-16 flex-col"
              >
                <AlertCircle className="h-6 w-6 mb-1" />
                Request Changes
              </Button>
              <Button
                variant={action === 'reject' ? 'default' : 'outline'}
                onClick={() => setAction('reject')}
                className="h-16 flex-col"
              >
                <XCircle className="h-6 w-6 mb-1" />
                Reject
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add comments about your decision..."
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!action}>
              Submit Decision
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}