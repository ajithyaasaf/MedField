import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Cloud, 
  CloudOff, 
  Download, 
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OfflineData {
  hospitals: any[];
  products: any[];
  draftQuotations: any[];
  lastSync: Date;
  pendingUploads: any[];
}

export default function OfflineManager() {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    hospitals: [],
    products: [],
    draftQuotations: [],
    lastSync: new Date(),
    pendingUploads: []
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'complete' | 'error'>('idle');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Connection Restored',
        description: 'Syncing offline data with server...',
      });
      handleAutoSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Connection Lost',
        description: 'Working in offline mode. Data will sync when connection is restored.',
        variant: 'destructive',
      });
      cacheEssentialData();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cached data on mount
    loadCachedData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadCachedData = () => {
    try {
      const cached = localStorage.getItem('medfield-offline-data');
      if (cached) {
        const data = JSON.parse(cached);
        setOfflineData({
          ...data,
          lastSync: new Date(data.lastSync)
        });
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const cacheEssentialData = async () => {
    try {
      // Cache hospitals data
      const hospitalsResponse = await fetch('/api/hospitals');
      const hospitals = await hospitalsResponse.json();

      // Cache products data
      const productsResponse = await fetch('/api/products');
      const products = await productsResponse.json();

      // Get draft quotations
      const draftQuotations = JSON.parse(localStorage.getItem('medfield-draft-quotations') || '[]');

      const newOfflineData = {
        hospitals,
        products,
        draftQuotations,
        lastSync: new Date(),
        pendingUploads: offlineData.pendingUploads
      };

      setOfflineData(newOfflineData);
      localStorage.setItem('medfield-offline-data', JSON.stringify(newOfflineData));

      toast({
        title: 'Data Cached',
        description: 'Essential data cached for offline use.',
      });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  };

  const handleAutoSync = async () => {
    if (!isOnline || offlineData.pendingUploads.length === 0) return;

    setSyncStatus('syncing');

    try {
      for (const item of offlineData.pendingUploads) {
        switch (item.type) {
          case 'quotation':
            await syncQuotation(item.data);
            break;
          case 'attendance':
            await syncAttendance(item.data);
            break;
          default:
            console.warn('Unknown sync item type:', item.type);
        }
      }

      // Clear pending uploads after successful sync
      const updatedData = {
        ...offlineData,
        pendingUploads: [],
        lastSync: new Date()
      };

      setOfflineData(updatedData);
      localStorage.setItem('medfield-offline-data', JSON.stringify(updatedData));

      setSyncStatus('complete');
      toast({
        title: 'Sync Complete',
        description: 'All offline data has been synchronized.',
      });

      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: 'Sync Failed',
        description: 'Some data could not be synchronized. Will retry when connection is stable.',
        variant: 'destructive',
      });
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const syncQuotation = async (quotationData: any) => {
    const response = await fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotationData)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync quotation: ${response.statusText}`);
    }

    return response.json();
  };

  const syncAttendance = async (attendanceData: any) => {
    const response = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attendanceData)
    });

    if (!response.ok) {
      throw new Error(`Failed to sync attendance: ${response.statusText}`);
    }

    return response.json();
  };

  const addToPendingUploads = (type: string, data: any) => {
    const newItem = {
      id: Date.now().toString(),
      type,
      data,
      timestamp: new Date(),
    };

    const updatedData = {
      ...offlineData,
      pendingUploads: [...offlineData.pendingUploads, newItem]
    };

    setOfflineData(updatedData);
    localStorage.setItem('medfield-offline-data', JSON.stringify(updatedData));
  };

  const clearOfflineData = () => {
    const clearedData = {
      hospitals: [],
      products: [],
      draftQuotations: [],
      lastSync: new Date(),
      pendingUploads: []
    };

    setOfflineData(clearedData);
    localStorage.removeItem('medfield-offline-data');
    localStorage.removeItem('medfield-draft-quotations');

    toast({
      title: 'Offline Data Cleared',
      description: 'All cached offline data has been removed.',
    });
  };

  const getStorageUsage = () => {
    try {
      const data = localStorage.getItem('medfield-offline-data');
      const draftData = localStorage.getItem('medfield-draft-quotations');
      const totalSize = (data?.length || 0) + (draftData?.length || 0);
      return (totalSize / 1024).toFixed(2); // Size in KB
    } catch {
      return '0';
    }
  };

  const formatLastSync = () => {
    if (!offlineData.lastSync) return 'Never';
    const now = new Date();
    const diff = now.getTime() - offlineData.lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Alert className={isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className="ml-2">
            {isOnline ? (
              <span className="text-green-800">Connected - Data syncing in real-time</span>
            ) : (
              <span className="text-red-800">Offline - Working with cached data</span>
            )}
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cloud className="h-5 w-5 mr-2 text-medical-blue" />
              Sync Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Sync:</span>
              <span className="text-sm text-gray-600">{formatLastSync()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pending Uploads:</span>
              <Badge variant={offlineData.pendingUploads.length > 0 ? 'destructive' : 'default'}>
                {offlineData.pendingUploads.length}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <div className="flex items-center space-x-2">
                {syncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm text-blue-600">Syncing...</span>
                  </>
                )}
                {syncStatus === 'complete' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Complete</span>
                  </>
                )}
                {syncStatus === 'error' && (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Error</span>
                  </>
                )}
                {syncStatus === 'idle' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Idle</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleAutoSync}
                disabled={!isOnline || syncStatus === 'syncing'}
                size="sm"
                className="flex-1"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Sync Now
              </Button>
              <Button
                onClick={cacheEssentialData}
                disabled={!isOnline}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Cache Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cached Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-medical-green" />
              Cached Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Hospitals:</span>
                <Badge variant="outline">{offlineData.hospitals.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Products:</span>
                <Badge variant="outline">{offlineData.products.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Draft Quotations:</span>
                <Badge variant="outline">{offlineData.draftQuotations.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Storage Used:</span>
                <Badge variant="outline">{getStorageUsage()} KB</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={clearOfflineData}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Clear Cached Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Uploads */}
      {offlineData.pendingUploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CloudOff className="h-5 w-5 mr-2 text-medical-amber" />
              Pending Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {offlineData.pendingUploads.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium capitalize">{item.type}</span>
                    <p className="text-sm text-gray-600">
                      Created {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for other components to use offline functionality
export const useOfflineManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveForOfflineSync = (type: string, data: any) => {
    try {
      const existing = JSON.parse(localStorage.getItem('medfield-offline-data') || '{}');
      const pendingUploads = existing.pendingUploads || [];
      
      const newItem = {
        id: Date.now().toString(),
        type,
        data,
        timestamp: new Date(),
      };

      const updated = {
        ...existing,
        pendingUploads: [...pendingUploads, newItem]
      };

      localStorage.setItem('medfield-offline-data', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to save for offline sync:', error);
      return false;
    }
  };

  const getCachedData = (type: string) => {
    try {
      const cached = localStorage.getItem('medfield-offline-data');
      if (cached) {
        const data = JSON.parse(cached);
        return data[type] || [];
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }
    return [];
  };

  return {
    isOnline,
    saveForOfflineSync,
    getCachedData
  };
};