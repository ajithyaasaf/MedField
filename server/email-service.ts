import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

interface SMSOptions {
  to: string;
  message: string;
}

export class EmailSMSService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a test transporter using Ethereal Email (for development)
    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER || 'test@ethereal.email',
        pass: process.env.EMAIL_PASS || 'test123',
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"MedField Pro" <noreply@medfieldpro.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      // Generate test preview URL for development
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log('Email sent successfully:', {
        messageId: info.messageId,
        previewUrl,
        to: options.to,
        subject: options.subject,
      });

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false };
    }
  }

  async sendSMS(options: SMSOptions): Promise<{ success: boolean; messageId?: string }> {
    try {
      // Simulate SMS sending since we don't have Twilio configured
      const messageId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('SMS sent successfully (simulated):', {
        messageId,
        to: options.to,
        message: options.message,
      });

      // In production, you would integrate with Twilio or similar SMS service:
      /*
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const message = await client.messages.create({
        body: options.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: options.to,
      });
      return { success: true, messageId: message.sid };
      */

      return { success: true, messageId };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false };
    }
  }

  generateQuotationEmailHTML(data: {
    quotationNumber: string;
    hospitalName: string;
    contactPerson: string;
    totalAmount: string;
    repName: string;
    validUntil: string;
  }): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation ${data.quotationNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .quotation-details { background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 24px; font-weight: bold; color: #1E40AF; }
        .footer { background: #F1F5F9; padding: 20px; text-align: center; font-size: 12px; color: #64748B; }
        .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 MedField Pro</h1>
            <h2>Medical Equipment Quotation</h2>
        </div>
        
        <div class="content">
            <p>Dear ${data.contactPerson},</p>
            
            <p>Thank you for your interest in our medical equipment solutions. Please find below the details of your quotation:</p>
            
            <div class="quotation-details">
                <h3>Quotation Details</h3>
                <p><strong>Quotation Number:</strong> ${data.quotationNumber}</p>
                <p><strong>Hospital:</strong> ${data.hospitalName}</p>
                <p><strong>Total Amount:</strong> <span class="amount">$${parseFloat(data.totalAmount).toLocaleString()}</span></p>
                <p><strong>Valid Until:</strong> ${data.validUntil}</p>
                <p><strong>Sales Representative:</strong> ${data.repName}</p>
            </div>
            
            <p>This quotation includes our premium medical equipment with full warranty and installation support. Our team is committed to providing the highest quality products to enhance your healthcare services.</p>
            
            <a href="#" class="button">Download Detailed Quotation (PDF)</a>
            
            <p>Should you have any questions or require modifications to this quotation, please don't hesitate to contact us. We appreciate your business and look forward to serving ${data.hospitalName}.</p>
            
            <p>Best regards,<br>
            ${data.repName}<br>
            MedField Pro Sales Team</p>
        </div>
        
        <div class="footer">
            <p>MedField Pro - Excellence in Medical Equipment Solutions</p>
            <p>📧 info@medfieldpro.com | 📞 +1-555-MEDFIELD | 🌐 www.medfieldpro.com</p>
            <p>This quotation is valid for 30 days from the date of issue.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export const emailSMSService = new EmailSMSService();