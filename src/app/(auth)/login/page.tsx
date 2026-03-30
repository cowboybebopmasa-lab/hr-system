"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 同意状態をlocalStorageで確認
      const consentKey = `privacy_consent_${email}`;
      const hasConsented = localStorage.getItem(consentKey);
      if (hasConsented) {
        router.push("/dashboard");
      } else {
        router.push("/consent");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "ログインに失敗しました";
      if (msg.includes("invalid-credential")) {
        setError("メールアドレスまたはパスワードが正しくありません");
      } else if (msg.includes("too-many-requests")) {
        setError("ログイン試行回数が多すぎます。しばらく待ってからお試しください");
      } else {
        setError("ログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/consent");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("email-already-in-use")) {
        setError("このメールアドレスは既に登録されています");
      } else if (msg.includes("weak-password")) {
        setError("パスワードは6文字以上で設定してください");
      } else if (msg.includes("invalid-email")) {
        setError("有効なメールアドレスを入力してください");
      } else {
        setError("登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
            HR
          </div>
        </div>
        <CardTitle>HR管理システム</CardTitle>
        <p className="text-sm text-muted-foreground">人材派遣AIマッチングシステム</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">ログイン</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">新規登録</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div><Label>メールアドレス</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" /></div>
            <div><Label>パスワード</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" onKeyDown={(e) => e.key === "Enter" && handleLogin()} /></div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}
            <Button onClick={handleLogin} disabled={loading || !email || !password} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />{loading ? "ログイン中..." : "ログイン"}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div><Label>メールアドレス</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" /></div>
            <div><Label>パスワード（6文字以上）</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" /></div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}
            <Button onClick={handleRegister} disabled={loading || !email || !password} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />{loading ? "登録中..." : "新規登録"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
