import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HeartPulse, User, Lock } from "lucide-react";
import { loginSchema, type LoginData } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Admin2FA from "@/components/admin-2fa";

export default function Login() {
  const [error, setError] = useState<string>("");
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Check if user is admin and requires 2FA
      if (data.user.role === 'admin') {
        setPendingUser(data.user);
        setShowTwoFA(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        setError("");
      }
    },
    onError: (error: any) => {
      setError(error.message || "Login failed");
    },
  });

  const handle2FAVerified = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    setShowTwoFA(false);
    setPendingUser(null);
    setError("");
  };

  const onSubmit = (data: LoginData) => {
    setError("");
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-medical-gray-light flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-medical-blue p-3 rounded-full">
              <HeartPulse className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-medical-gray-dark">
            MedField Pro
          </CardTitle>
          <p className="text-medical-gray mt-2">
            Medical Field Rep & Admin Platform
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-medical-gray-dark font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-medical-gray" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  className="pl-9"
                  {...form.register("username")}
                />
              </div>
              {form.formState.errors.username && (
                <p className="text-sm text-medical-red">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-medical-gray-dark font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-medical-gray" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-9"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-medical-red">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-medical-blue hover:bg-medical-blue-dark text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-medical-gray">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1">
                <p><strong>Admin:</strong> admin / admin123</p>
                <p><strong>Field Rep:</strong> sarah.johnson / password123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Modal for Admin Users */}
      {showTwoFA && pendingUser && (
        <Admin2FA
          onClose={() => {
            setShowTwoFA(false);
            setPendingUser(null);
          }}
          onVerified={handle2FAVerified}
          userEmail={pendingUser.username}
        />
      )}
    </div>
  );
}
