import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/feed")({
  component: Feed,
});

function Feed() {
  const { profile, session } = useAuth();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["feed_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select(`
          *,
          author:profiles(id, full_name, avatar_url, headline),
          comments:feed_comments(*, author:profiles(id, full_name, avatar_url))
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createPost = useMutation({
    mutationFn: async (content: string) => {
      if (!profile) throw new Error("Must be logged in to post");
      const { error } = await supabase
        .from("feed_posts")
        .insert({ author_id: profile.id, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewPost("");
      toast.success("Posted successfully!");
      queryClient.invalidateQueries({ queryKey: ["feed_posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell
      title="Community Feed"
      subtitle="Share updates, ask for advice, and connect with fellow alumni."
    >
      <div className="mx-auto max-w-2xl">
        {session ? (
          <div className="card-surface mb-8 p-4">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>{profile?.full_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="What's on your mind? Share an update or ask the community..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none bg-background"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={() => createPost.mutate(newPost)}
                    disabled={!newPost.trim() || createPost.isPending}
                  >
                    <Send className="mr-2 size-4" /> Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-surface mb-8 p-6 text-center">
            <p className="mb-4 text-muted-foreground">Sign in to join the conversation.</p>
          </div>
        )}

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="card-surface h-32 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : posts?.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-4 size-12 opacity-20" />
              <p>No posts yet. Be the first to share an update!</p>
            </div>
          ) : (
            posts?.map((post) => (
              <article key={post.id} className="card-surface p-5">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={(post.author as any)?.avatar_url || ""} />
                    <AvatarFallback>{(post.author as any)?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{(post.author as any)?.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(post.author as any)?.headline || "Alumnus"} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                  {post.content}
                </div>
                
                {post.comments && post.comments.length > 0 && (
                  <div className="mt-6 space-y-4 border-t pt-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Comments ({post.comments.length})
                    </h4>
                    {post.comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-3 text-sm">
                        <Avatar className="size-8">
                          <AvatarImage src={comment.author?.avatar_url || ""} />
                          <AvatarFallback>{comment.author?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{comment.author?.full_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p>{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
