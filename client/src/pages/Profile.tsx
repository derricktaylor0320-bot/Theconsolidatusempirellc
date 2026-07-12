import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Camera, Trash2, MapPin, UserRound } from "lucide-react";

function errorText(err: any): string {
  const message = String(err?.message || "Something went wrong").replace(/^\d+:\s*/, "");
  try {
    return JSON.parse(message).error || message;
  } catch {
    return message;
  }
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/auth");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setLocationValue(user.location || "");
    }
  }, [user?.id]);

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("PATCH", "/api/auth/profile", {
        displayName: displayName.trim(),
        location: locationValue.trim(),
      });
      await refreshUser();
      toast({
        title: "Profile saved",
        description: "Your name and location will show on your reviews.",
      });
    } catch (err) {
      toast({ title: "Couldn't save profile", description: errorText(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/auth/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload failed");
      }
      await refreshUser();
      toast({
        title: "Photo updated",
        description: "Your picture will now appear next to your reviews.",
      });
    } catch (err) {
      toast({ title: "Couldn't upload photo", description: errorText(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setUploading(true);
    try {
      await apiRequest("DELETE", "/api/auth/profile/avatar");
      await refreshUser();
      toast({ title: "Photo removed" });
    } catch (err) {
      toast({ title: "Couldn't remove photo", description: errorText(err), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-16 max-w-2xl">
        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-primary mb-2">
          My Profile
        </h1>
        <p className="text-muted-foreground mb-10">
          Personalize how you appear across the site. Your photo and location
          show up next to any product reviews you write.
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wider text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 flex-wrap">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Your profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary/40"
                  data-testid="img-profile-avatar"
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-primary font-display text-4xl font-bold"
                  data-testid="text-avatar-initial"
                >
                  {initial}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-avatar-file"
                />
                <Button
                  onClick={handlePickFile}
                  disabled={uploading}
                  className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                  data-testid="button-upload-avatar"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {user.avatarUrl ? "Change Photo" : "Upload Photo"}
                </Button>
                {user.avatarUrl && (
                  <Button
                    variant="outline"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    className="uppercase tracking-wider font-display"
                    data-testid="button-remove-avatar"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP, or GIF — up to 5 MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wider text-lg flex items-center gap-2">
              <UserRound className="w-5 h-5 text-primary" />
              About You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Display name</Label>
                <Input
                  id="profile-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="The name shown on your reviews"
                  data-testid="input-display-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-location" className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Location
                </Label>
                <Input
                  id="profile-location"
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  maxLength={80}
                  placeholder='e.g. "Atlanta, GA" or "USA"'
                  data-testid="input-location"
                />
                <p className="text-xs text-muted-foreground">
                  Your state or country, shown next to your reviews — like
                  "Houston, TX" or "USA". Leave blank to keep it private.
                </p>
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
                data-testid="button-save-profile"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground mt-8" data-testid="text-profile-email">
          Signed in as <span className="text-secondary-foreground">{user.email}</span>
        </p>
      </main>
      <Footer />
    </div>
  );
}
