/**
 * PDF generation utilities for quotations and reports
 * Uses jsPDF library for client-side PDF generation
 */

interface QuotationData {
  quotationNumber: string;
  hospital: {
    name: string;
    address: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  products: Array<{
    id: number;
    name: string;
    model?: string;
    category: string;
    quantity: number;
    basePrice: string;
    lineTotal: number;
  }>;
  subtotal: number;
  discountAmount: number;
  total: number;
  notes?: string;
  createdAt: Date;
}

/**
 * Generate a quotation PDF using dynamic import to reduce bundle size
 */
export async function generateQuotationPDF(quotationData: QuotationData): Promise<void> {
  try {
    // Dynamic import to reduce initial bundle size
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Medical blue
    doc.text('MedField Pro', 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Medical gray
    doc.text('Medical Equipment & Solutions', 20, currentY + 8);
    
    currentY += 25;

    // Quotation Title
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // Dark gray
    doc.text(`Quotation: ${quotationData.quotationNumber}`, 20, currentY);
    
    doc.setFontSize(10);
    doc.text(`Date: ${quotationData.createdAt.toLocaleDateString()}`, pageWidth - 60, currentY);
    
    currentY += 20;

    // Hospital Information
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Bill To:', 20, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    currentY += 8;
    doc.text(quotationData.hospital.name, 20, currentY);
    currentY += 5;
    doc.text(quotationData.hospital.address, 20, currentY);
    
    if (quotationData.hospital.contactPerson) {
      currentY += 5;
      doc.text(`Contact: ${quotationData.hospital.contactPerson}`, 20, currentY);
    }
    
    if (quotationData.hospital.contactEmail) {
      currentY += 5;
      doc.text(`Email: ${quotationData.hospital.contactEmail}`, 20, currentY);
    }
    
    if (quotationData.hospital.contactPhone) {
      currentY += 5;
      doc.text(`Phone: ${quotationData.hospital.contactPhone}`, 20, currentY);
    }
    
    currentY += 20;

    // Products Table Header
    doc.setFillColor(244, 244, 245); // Light gray background
    doc.rect(20, currentY - 5, pageWidth - 40, 15, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Item', 25, currentY + 5);
    doc.text('Model', 80, currentY + 5);
    doc.text('Qty', 120, currentY + 5);
    doc.text('Unit Price', 140, currentY + 5);
    doc.text('Total', pageWidth - 40, currentY + 5);
    
    currentY += 20;

    // Products Table Rows
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    
    quotationData.products.forEach((product, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 20;
      }
      
      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, currentY - 4, pageWidth - 40, 12, 'F');
      }
      
      const unitPrice = parseFloat(product.basePrice);
      
      doc.text(product.name, 25, currentY + 3);
      doc.text(product.model || '-', 80, currentY + 3);
      doc.text(product.quantity.toString(), 120, currentY + 3);
      doc.text(`$${unitPrice.toLocaleString()}`, 140, currentY + 3);
      doc.text(`$${product.lineTotal.toLocaleString()}`, pageWidth - 40, currentY + 3);
      
      // Product category/description on next line
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(product.category, 25, currentY + 8);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      
      currentY += 15;
    });

    currentY += 10;

    // Totals Section
    const totalsStartX = pageWidth - 80;
    
    // Subtotal
    doc.setFontSize(10);
    doc.text('Subtotal:', totalsStartX - 40, currentY);
    doc.text(`$${quotationData.subtotal.toLocaleString()}`, totalsStartX, currentY);
    currentY += 8;
    
    // Discount
    if (quotationData.discountAmount > 0) {
      doc.setTextColor(16, 185, 129); // Green color for discount
      doc.text('Discount:', totalsStartX - 40, currentY);
      doc.text(`-$${quotationData.discountAmount.toLocaleString()}`, totalsStartX, currentY);
      currentY += 8;
    }
    
    // Total
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Total:', totalsStartX - 40, currentY);
    doc.text(`$${quotationData.total.toLocaleString()}`, totalsStartX, currentY);
    
    // Draw line above total
    doc.setLineWidth(0.5);
    doc.line(totalsStartX - 40, currentY - 3, totalsStartX + 20, currentY - 3);
    
    currentY += 20;

    // Notes Section
    if (quotationData.notes && quotationData.notes.trim()) {
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text('Notes:', 20, currentY);
      
      currentY += 8;
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      
      // Split notes into lines that fit the page width
      const lines = doc.splitTextToSize(quotationData.notes, pageWidth - 40);
      doc.text(lines, 20, currentY);
      
      currentY += lines.length * 5 + 10;
    }

    // Footer
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = pageHeight - 60;
    } else {
      currentY = pageHeight - 60;
    }
    
    // Footer line
    doc.setLineWidth(0.3);
    doc.setDrawColor(229, 231, 235);
    doc.line(20, currentY, pageWidth - 20, currentY);
    
    currentY += 10;
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('This quotation is valid for 30 days from the date of issue.', 20, currentY);
    doc.text('Thank you for choosing MedField Pro for your medical equipment needs.', 20, currentY + 5);
    
    // Page number
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - 30, currentY + 5);

    // Save the PDF
    const fileName = `${quotationData.quotationNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${
      quotationData.hospital.name.replace(/[^a-zA-Z0-9]/g, '_')
    }.pdf`;
    
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

/**
 * Generate attendance report PDF
 */
export async function generateAttendanceReportPDF(
  reportData: {
    title: string;
    dateRange: string;
    attendanceRecords: Array<{
      date: string;
      employeeName: string;
      clockIn: string;
      clockOut: string;
      hospital: string;
      withinGeoFence: boolean;
    }>;
  }
): Promise<void> {
  try {
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // Report Header
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('MedField Pro', 20, currentY);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text(reportData.title, 20, currentY + 12);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Period: ${reportData.dateRange}`, 20, currentY + 20);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, currentY + 20);
    
    currentY += 40;

    // Table Header
    doc.setFillColor(244, 244, 245);
    doc.rect(20, currentY - 5, pageWidth - 40, 12, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('Date', 25, currentY + 3);
    doc.text('Employee', 50, currentY + 3);
    doc.text('Clock In', 90, currentY + 3);
    doc.text('Clock Out', 120, currentY + 3);
    doc.text('Location', 150, currentY + 3);
    doc.text('Status', pageWidth - 30, currentY + 3);
    
    currentY += 15;

    // Table Rows
    reportData.attendanceRecords.forEach((record, index) => {
      if (currentY > 270) { // Check if we need a new page
        doc.addPage();
        currentY = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, currentY - 3, pageWidth - 40, 10, 'F');
      }
      
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      
      doc.text(record.date, 25, currentY + 2);
      doc.text(record.employeeName, 50, currentY + 2);
      doc.text(record.clockIn, 90, currentY + 2);
      doc.text(record.clockOut || '-', 120, currentY + 2);
      doc.text(record.hospital, 150, currentY + 2);
      
      // Status with color coding
      if (record.withinGeoFence) {
        doc.setTextColor(16, 185, 129); // Green
        doc.text('✓', pageWidth - 30, currentY + 2);
      } else {
        doc.setTextColor(245, 101, 101); // Red
        doc.text('!', pageWidth - 30, currentY + 2);
      }
      
      currentY += 10;
    });

    // Save the PDF
    const fileName = `Attendance_Report_${reportData.dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating attendance report PDF:', error);
    throw new Error('Failed to generate attendance report PDF. Please try again.');
  }
}

/**
 * Validate PDF generation requirements
 */
export function validatePDFData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('No data provided for PDF generation');
    return { isValid: false, errors };
  }
  
  // Add specific validation logic based on data type
  if (data.quotationNumber !== undefined) {
    // Quotation validation
    if (!data.hospital?.name) {
      errors.push('Hospital information is required');
    }
    
    if (!data.products || data.products.length === 0) {
      errors.push('At least one product must be selected');
    }
    
    if (typeof data.total !== 'number' || data.total <= 0) {
      errors.push('Valid total amount is required');
    }
  }
  
  return { isValid: errors.length === 0, errors };
}

/**
 * Format currency for PDF display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date for PDF display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
