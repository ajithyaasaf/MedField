import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Send, Check, X, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface EmailSmsSimulatorProps {
  onClose: () => void;
  quotationData?: any;
}

interface Message {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  content: string;
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  timestamp: Date;
  quotationNumber?: string;
}

export default function EmailSmsSimulator({ onClose, quotationData }: EmailSmsSimulatorProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [emailForm, setEmailForm] = useState({
    recipient: quotationData?.hospital?.contactEmail || '',
    subject: `Quotation ${quotationData?.quotationNumber || ''} - MedField Pro`,
    content: generateEmailTemplate(quotationData),
  });
  const [smsForm, setSmsForm] = useState({
    recipient: quotationData?.hospital?.contactPhone || '',
    content: generateSmsTemplate(quotationData),
  });

  function generateEmailTemplate(data: any) {
    if (!data) return '';
    
    return `Dear ${data.hospital?.contactPerson || 'Sir/Madam'},

I hope this email finds you well. Please find attached our quotation ${data.quotationNumber} for your consideration.

Quotation Details:
- Total Amount: $${parseFloat(data.totalAmount || '0').toLocaleString()}
- Valid Until: ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}

We appreciate the opportunity to serve ${data.hospital?.name} and look forward to your response.

Best regards,
${data.createdBy?.name || 'MedField Pro Team'}
MedField Pro
Phone: +1-555-MEDFIELD
Email: info@medfieldpro.com

This quotation is valid for 30 days from the date of issue.`;
  }

  function generateSmsTemplate(data: any) {
    if (!data) return '';
    
    return `Hi! New quotation ${data.quotationNumber} sent to ${data.hospital?.name}. Total: $${parseFloat(data.totalAmount || '0').toLocaleString()}. Valid until ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MMM d')}. Reply STOP to opt out. - MedField Pro`;
  }

  const sendMessage = async (type: 'email' | 'sms') => {
    const messageId = Date.now().toString();
    const form = type === 'email' ? emailForm : smsForm;
    
    const newMessage: Message = {
      id: messageId,
      type,
      recipient: form.recipient,
      subject: type === 'email' ? emailForm.subject : undefined,
      content: form.content,
      status: 'sending',
      timestamp: new Date(),
      quotationNumber: quotationData?.quotationNumber,
    };

    setMessages(prev => [newMessage, ...prev]);

    // Simulate sending process
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'sent' } : msg
      ));
    }, 1000);

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status: 'delivered' } : msg
      ));
      
      toast({
        title: `${type === 'email' ? 'Email' : 'SMS'} Sent`,
        description: `Your ${type} has been delivered successfully.`,
      });
    }, 2500);

    // Clear form after sending
    if (type === 'email') {
      setEmailForm(prev => ({ ...prev, recipient: '', subject: '', content: '' }));
    } else {
      setSmsForm(prev => ({ ...prev, recipient: '', content: '' }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered': return <Check className="h-4 w-4 text-green-500" />;
      case 'failed': return <X className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-6 w-6 text-medical-blue" />
              <span>Send Quotation</span>
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('email')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'email' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              <Mail className="h-4 w-4 inline mr-2" />
              Email
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`pb-2 px-1 border-b-2 transition-colors ${
                activeTab === 'sms' 
                  ? 'border-medical-blue text-medical-blue' 
                  : 'border-transparent text-gray-500'
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              SMS
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {activeTab === 'email' ? 'Compose Email' : 'Compose SMS'}
              </h3>
              
              {activeTab === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-recipient">Recipient Email</Label>
                    <Input
                      id="email-recipient"
                      type="email"
                      value={emailForm.recipient}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="hospital@example.com"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email-subject">Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Email subject"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email-content">Message</Label>
                    <Textarea
                      id="email-content"
                      value={emailForm.content}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={12}
                      placeholder="Email content"
                    />
                  </div>
                  
                  <Button
                    onClick={() => sendMessage('email')}
                    disabled={!emailForm.recipient || !emailForm.subject || !emailForm.content}
                    className="w-full bg-medical-blue hover:bg-medical-blue-dark"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sms-recipient">Recipient Phone</Label>
                    <Input
                      id="sms-recipient"
                      type="tel"
                      value={smsForm.recipient}
                      onChange={(e) => setSmsForm(prev => ({ ...prev, recipient: e.target.value }))}
                      placeholder="+1-555-0123"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sms-content">Message ({smsForm.content.length}/160)</Label>
                    <Textarea
                      id="sms-content"
                      value={smsForm.content}
                      onChange={(e) => setSmsForm(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      maxLength={160}
                      placeholder="SMS content (max 160 characters)"
                    />
                  </div>
                  
                  <Button
                    onClick={() => sendMessage('sms')}
                    disabled={!smsForm.recipient || !smsForm.content}
                    className="w-full bg-medical-green hover:bg-medical-green-dark"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send SMS
                  </Button>
                </div>
              )}
            </div>
            
            {/* Message History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Message History</h3>
              
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages sent yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          {message.type === 'email' ? (
                            <Mail className="h-4 w-4 text-medical-blue" />
                          ) : (
                            <MessageSquare className="h-4 w-4 text-medical-green" />
                          )}
                          <span className="font-medium">{message.recipient}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(message.status)}
                          <Badge className={getStatusColor(message.status)}>
                            {message.status}
                          </Badge>
                        </div>
                      </div>
                      
                      {message.subject && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {message.subject}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {message.content}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{format(message.timestamp, 'MMM d, h:mm a')}</span>
                        {message.quotationNumber && (
                          <span>Quote: {message.quotationNumber}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}