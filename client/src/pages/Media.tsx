import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Music,
  Video,
  Play,
  Loader2,
  Plus,
  Trash2,
  LinkIcon,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { MediaItem } from "@shared/schema";

// Turn an external link into an embeddable player URL where we recognize the
// platform (YouTube, Vimeo, SoundCloud). Anything else falls back to a native
// <video>/<audio> element (works for direct file links) or a plain link.
function getEmbed(url: string): { kind: "iframe"; src: string } | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/,
  );
  if (yt) return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };

  if (/soundcloud\.com\//.test(url)) {
    return {
      kind: "iframe",
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        url,
      )}&color=%23d4af37&auto_play=true&hide_related=true&show_comments=false`,
    };
  }
  return null;
}

function MediaPlayer({ item }: { item: MediaItem }) {
  const embed = item.sourceType === "link" ? getEmbed(item.url) : null;

  if (embed) {
    return (
      <div
        className={
          item.mediaType === "audio"
            ? "w-full"
            : "relative w-full aspect-video overflow-hidden rounded-lg bg-black"
        }
      >
        <iframe
          src={embed.src}
          title={item.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className={item.mediaType === "audio" ? "w-full h-40" : "absolute inset-0 w-full h-full"}
          data-testid={`iframe-player-${item.id}`}
        />
      </div>
    );
  }

  if (item.mediaType === "audio") {
    return (
      <audio
        src={item.url}
        controls
        autoPlay
        className="w-full"
        data-testid={`audio-player-${item.id}`}
      />
    );
  }

  return (
    <video
      src={item.url}
      controls
      autoPlay
      playsInline
      className="w-full max-h-[70vh] rounded-lg bg-black"
      data-testid={`video-player-${item.id}`}
    />
  );
}

function AddMediaDialog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link form state
  const [linkTitle, setLinkTitle] = useState("");
  const [linkCollection, setLinkCollection] = useState("");
  const [linkType, setLinkType] = useState<"video" | "audio">("video");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkDesc, setLinkDesc] = useState("");

  // Upload form state
  const [upTitle, setUpTitle] = useState("");
  const [upCollection, setUpCollection] = useState("");
  const [upDesc, setUpDesc] = useState("");
  const [upProgress, setUpProgress] = useState<number | null>(null);

  const resetAll = () => {
    setLinkTitle("");
    setLinkCollection("");
    setLinkType("video");
    setLinkUrl("");
    setLinkDesc("");
    setUpTitle("");
    setUpCollection("");
    setUpDesc("");
    setUpProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const linkMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/media", {
        title: linkTitle,
        collection: linkCollection,
        mediaType: linkType,
        url: linkUrl,
        description: linkDesc || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Link added", description: "Your clip is now live on the page." });
      resetAll();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not add link",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  // Uploads use XHR so we can show a progress bar for large files.
  const uploadFile = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({ title: "Pick a file first", variant: "destructive" });
      return;
    }
    if (!upTitle.trim() || !upCollection.trim()) {
      toast({
        title: "Title and collection are required",
        variant: "destructive",
      });
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("title", upTitle);
    form.append("collection", upCollection);
    if (upDesc) form.append("description", upDesc);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/media/upload");
    xhr.withCredentials = true;
    setUpProgress(0);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        setUpProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      setUpProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        queryClient.invalidateQueries({ queryKey: ["/api/media"] });
        toast({ title: "Upload complete", description: "Your file is now live on the page." });
        resetAll();
        setOpen(false);
      } else {
        let msg = "Upload failed";
        try {
          msg = JSON.parse(xhr.responseText).error || msg;
        } catch {}
        toast({ title: "Upload failed", description: msg, variant: "destructive" });
      }
    };
    xhr.onerror = () => {
      setUpProgress(null);
      toast({ title: "Upload failed", description: "Network error", variant: "destructive" });
    };
    xhr.send(form);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetAll(); }}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display gap-2"
          data-testid="button-add-media"
        >
          <Plus className="h-4 w-4" />
          Add Media
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            Add a clip or audio project
          </DialogTitle>
          <DialogDescription>
            Paste a link to something already online, or upload a file straight
            from your phone or computer.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="gap-2" data-testid="tab-link">
              <LinkIcon className="h-4 w-4" /> Paste a link
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2" data-testid="tab-upload">
              <Upload className="h-4 w-4" /> Upload a file
            </TabsTrigger>
          </TabsList>

          {/* Paste a link */}
          <TabsContent value="link" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="link-title">Title</Label>
              <Input
                id="link-title"
                placeholder="e.g. Sunday Soul Session"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                data-testid="input-link-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-collection">Collection name</Label>
              <Input
                id="link-collection"
                placeholder="e.g. R&B Singing Clips"
                value={linkCollection}
                onChange={(e) => setLinkCollection(e.target.value)}
                data-testid="input-link-collection"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={linkType} onValueChange={(v) => setLinkType(v as "video" | "audio")}>
                <SelectTrigger data-testid="select-link-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-url">Link (YouTube, Vimeo, SoundCloud, etc.)</Label>
              <Input
                id="link-url"
                placeholder="https://youtube.com/watch?v=..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                data-testid="input-link-url"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="link-desc">Description (optional)</Label>
              <Textarea
                id="link-desc"
                rows={2}
                value={linkDesc}
                onChange={(e) => setLinkDesc(e.target.value)}
                data-testid="input-link-desc"
              />
            </div>
            <Button
              className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
              onClick={() => linkMutation.mutate()}
              disabled={linkMutation.isPending}
              data-testid="button-submit-link"
            >
              {linkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add Link"
              )}
            </Button>
          </TabsContent>

          {/* Upload a file */}
          <TabsContent value="upload" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="up-title">Title</Label>
              <Input
                id="up-title"
                placeholder="e.g. Studio Take 1"
                value={upTitle}
                onChange={(e) => setUpTitle(e.target.value)}
                data-testid="input-upload-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-collection">Collection name</Label>
              <Input
                id="up-collection"
                placeholder="e.g. R&B Singing Clips"
                value={upCollection}
                onChange={(e) => setUpCollection(e.target.value)}
                data-testid="input-upload-collection"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-file">Video or audio file (max 500 MB)</Label>
              <Input
                id="up-file"
                type="file"
                accept="video/*,audio/*"
                ref={fileInputRef}
                data-testid="input-upload-file"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-desc">Description (optional)</Label>
              <Textarea
                id="up-desc"
                rows={2}
                value={upDesc}
                onChange={(e) => setUpDesc(e.target.value)}
                data-testid="input-upload-desc"
              />
            </div>
            {upProgress !== null && (
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${upProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Uploading… {upProgress}%
                </p>
              </div>
            )}
            <Button
              className="w-full bg-primary text-black hover:bg-primary/90 uppercase tracking-wider font-display"
              onClick={uploadFile}
              disabled={upProgress !== null}
              data-testid="button-submit-upload"
            >
              {upProgress !== null ? "Uploading…" : "Upload File"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function Media() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playing, setPlaying] = useState<MediaItem | null>(null);

  const { data: items = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({ title: "Removed" });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not remove",
        description: err.message.replace(/^\d+:\s*/, ""),
        variant: "destructive",
      });
    },
  });

  // Group items by their collection name, preserving first-seen order.
  const collections = useMemo(() => {
    const map = new Map<string, MediaItem[]>();
    for (const item of items) {
      const list = map.get(item.collection) ?? [];
      list.push(item);
      map.set(item.collection, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-primary/15">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />
          <div className="container mx-auto px-4 py-16 relative z-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tight"
              data-testid="text-media-title"
            >
              Media & <span className="gold-shine">Music</span>
            </motion.h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Singing clips, studio sessions, and audio projects — straight from
              the Empire. Tap any title to watch or listen.
            </p>
            {isAuthenticated && (
              <div className="mt-6 flex justify-center">
                <AddMediaDialog />
              </div>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-20" data-testid="empty-media">
              <Music className="h-12 w-12 text-primary/50 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                No clips posted yet — check back soon.
              </p>
              {isAuthenticated && (
                <p className="text-sm text-muted-foreground mt-2">
                  Use “Add Media” above to post your first clip.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {collections.map(([name, list]) => (
                <div key={name} data-testid={`collection-${name}`}>
                  <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-primary mb-5">
                    {name}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {list.map((item) => {
                      const Icon = item.mediaType === "audio" ? Music : Video;
                      return (
                        <Card
                          key={item.id}
                          className="group relative overflow-hidden border-primary/20 bg-card/60 hover:border-primary/50 transition-colors"
                          data-testid={`card-media-${item.id}`}
                        >
                          <button
                            onClick={() => setPlaying(item)}
                            className="w-full text-left focus:outline-none"
                            data-testid={`button-play-${item.id}`}
                          >
                            <div className="relative aspect-video flex items-center justify-center bg-gradient-to-br from-primary/25 to-background">
                              <Icon className="h-10 w-10 text-primary/70" />
                              <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                <Play className="h-12 w-12 text-primary fill-primary" />
                              </span>
                            </div>
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-primary shrink-0" />
                                <h3 className="font-display uppercase tracking-wide text-base truncate">
                                  {item.title}
                                </h3>
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </CardContent>
                          </button>
                          {isAuthenticated && (
                            <button
                              onClick={() => {
                                if (confirm(`Remove "${item.title}"?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              className="absolute top-2 right-2 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-background/80 text-destructive hover:bg-destructive hover:text-white transition-colors"
                              aria-label="Remove"
                              data-testid={`button-delete-${item.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Player */}
      <Dialog open={!!playing} onOpenChange={(o) => !o && setPlaying(null)}>
        <DialogContent className="max-w-3xl">
          {playing && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display uppercase tracking-wide">
                  {playing.title}
                </DialogTitle>
                {playing.description && (
                  <DialogDescription>{playing.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="mt-2">
                <MediaPlayer item={playing} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
