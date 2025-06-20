import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Send, X } from "lucide-react";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateQuotationPDF } from "@/lib/pdf-generator";

const quotationSchema = z.object({
  hospitalId: z.number().min(1, "Please select a hospital"),
  products: z.array(z.object({
    id: z.number(),
    quantity: z.number().min(1),
    unitPrice: z.string(),
  })).min(1, "Please select at least one product"),
  discountPercent: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type QuotationFormData = z.infer<typeof quotationSchema>;

interface QuotationBuilderProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuotationBuilder({ onClose, onSuccess }: QuotationBuilderProps) {
  const [selectedProducts, setSelectedProducts] = useState<{ [key: number]: { quantity: number; selected: boolean } }>({});
  const { toast } = useToast();

  const { data: hospitals } = useQuery({
    queryKey: ['/api/hospitals'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
  });

  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      hospitalId: 0,
      products: [],
      discountPercent: 0,
      notes: "",
    },
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/quotations", data);
      return response.json();
    },
    onSuccess: (quotation) => {
      toast({
        title: "Quotation Created",
        description: `Quotation ${quotation.quotationNumber} has been created successfully.`,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quotation",
        variant: "destructive",
      });
    },
  });

  const handleProductToggle = (productId: number, checked: boolean) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        quantity: prev[productId]?.quantity || 1,
        selected: checked,
      },
    }));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: Math.max(1, quantity),
      },
    }));
  };

  const calculateTotals = () => {
    const selectedProductsList = Object.entries(selectedProducts)
      .filter(([_, data]) => data.selected)
      .map(([id, data]) => {
        const product = products?.find((p: any) => p.id === parseInt(id));
        return {
          ...product,
          quantity: data.quantity,
          lineTotal: parseFloat(product?.basePrice || "0") * data.quantity,
        };
      });

    const subtotal = selectedProductsList.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountAmount = (subtotal * (form.watch("discountPercent") || 0)) / 100;
    const total = subtotal - discountAmount;

    return { selectedProductsList, subtotal, discountAmount, total };
  };

  const { selectedProductsList, subtotal, discountAmount, total } = calculateTotals();

  const onSubmit = (data: QuotationFormData) => {
    const quotationProducts = Object.entries(selectedProducts)
      .filter(([_, productData]) => productData.selected)
      .map(([id, productData]) => {
        const product = products?.find((p: any) => p.id === parseInt(id));
        return {
          id: parseInt(id),
          quantity: productData.quantity,
          unitPrice: product?.basePrice || "0",
        };
      });

    if (quotationProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product",
        variant: "destructive",
      });
      return;
    }

    const quotationData = {
      hospitalId: data.hospitalId,
      products: quotationProducts,
      totalAmount: total.toFixed(2),
      discountPercent: data.discountPercent.toString(),
      notes: data.notes || "",
      status: "draft",
    };

    createQuotationMutation.mutate(quotationData);
  };

  const handleGeneratePDF = async () => {
    const hospital = hospitals?.find((h: any) => h.id === form.watch("hospitalId"));
    if (!hospital || selectedProductsList.length === 0) {
      toast({
        title: "Error",
        description: "Please select a hospital and products first",
        variant: "destructive",
      });
      return;
    }

    try {
      const quotationData = {
        quotationNumber: `QT-${new Date().getFullYear()}-PREVIEW`,
        hospital,
        products: selectedProductsList,
        subtotal,
        discountAmount,
        total,
        notes: form.watch("notes") || "",
        createdAt: new Date(),
      };

      await generateQuotationPDF(quotationData);
      
      toast({
        title: "PDF Generated",
        description: "Quotation PDF has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-medical-blue" />
            New Quotation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Hospital Selection */}
          <div>
            <Label className="text-sm font-medium text-medical-gray-dark">Select Hospital</Label>
            <Select
              value={form.watch("hospitalId")?.toString() || ""}
              onValueChange={(value) => form.setValue("hospitalId", parseInt(value))}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue placeholder="Choose a hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals?.map((hospital: any) => (
                  <SelectItem key={hospital.id} value={hospital.id.toString()}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Selection */}
          <div>
            <Label className="text-sm font-medium text-medical-gray-dark">Products & Services</Label>
            <div className="space-y-2 mt-2">
              {products?.map((product: any) => (
                <Card key={product.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedProducts[product.id]?.selected || false}
                        onCheckedChange={(checked) => handleProductToggle(product.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-medical-gray-dark">{product.name}</div>
                        <div className="text-sm text-medical-gray">
                          {product.model && `Model: ${product.model} • `}
                          {product.category}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {selectedProducts[product.id]?.selected && (
                          <>
                            <Label className="text-sm">Qty:</Label>
                            <Input
                              type="number"
                              min="1"
                              value={selectedProducts[product.id]?.quantity || 1}
                              onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </>
                        )}
                        <div className="text-right">
                          <div className="font-semibold">${parseFloat(product.basePrice).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          {selectedProductsList.length > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-medical-gray-dark mb-3">Pricing Summary</h4>
                <div className="space-y-2">
                  {selectedProductsList.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} (x{item.quantity})</span>
                      <span>${item.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center space-x-2">
                      <span>Discount:</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 h-8"
                        {...form.register("discountPercent", { valueAsNumber: true })}
                      />
                      <span>%</span>
                    </div>
                    <span className="text-medical-green">-${discountAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium text-medical-gray-dark">Additional Notes</Label>
            <Textarea
              className="mt-2"
              placeholder="Add any special terms, delivery notes, or next steps..."
              rows={3}
              {...form.register("notes")}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleGeneratePDF}
              disabled={selectedProductsList.length === 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              Preview PDF
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-medical-blue hover:bg-medical-blue-dark"
              disabled={createQuotationMutation.isPending || selectedProductsList.length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              {createQuotationMutation.isPending ? "Creating..." : "Create Quote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
