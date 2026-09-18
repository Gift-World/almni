import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Send, MessageSquare, ChevronLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  component: Messages,
});

function Messages() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Fetch all messages for the current user
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Extract unique conversations
  const conversations = useMemo(() => {
    if (!messages || !profile) return [];
    const convos = new Map<string, any>();
    
    messages.forEach((msg) => {
      const otherUser = msg.sender_id === profile.id ? msg.receiver : msg.sender;
      if (!otherUser) return;
      
      const existing = convos.get(otherUser.id);
      if (!existing || new Date(msg.created_at) > new Date(existing.lastMessageAt)) {
        convos.set(otherUser.id, {
          user: otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unread: msg.receiver_id === profile.id && !msg.read_at,
        });
      }
    });
    
    return Array.from(convos.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [messages, profile]);

  // Set initial selected user if none selected
  if (!selectedUserId && conversations.length > 0) {
    setSelectedUserId(conversations[0].user.id);
  }

  const selectedConversationMessages = useMemo(() => {
    if (!messages || !selectedUserId) return [];
    return messages.filter(
      (m) => m.sender_id === selectedUserId || m.receiver_id === selectedUserId
    );
  }, [messages, selectedUserId]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!profile || !selectedUserId) return;
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: profile.id,
          receiver_id: selectedUserId,
          content,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedUser = conversations.find(c => c.user.id === selectedUserId)?.user;

  return (
    <PageShell title="Messages" subtitle="Connect directly with other alumni.">
      <div className="card-surface flex h-[600px] overflow-hidden rounded-xl border">
        
        {/* Sidebar */}
        <div className={cn(
          "w-full md:w-1/3 border-r bg-muted/10 flex-col",
          selectedUserId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b font-semibold">Conversations</div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingMessages ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No messages yet. Go to the directory to connect!
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.user.id}
                  onClick={() => setSelectedUserId(c.user.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b",
                    selectedUserId === c.user.id && "bg-muted"
                  )}
                >
                  <Avatar>
                    <AvatarImage src={c.user.avatar_url || ""} />
                    <AvatarFallback>{c.user.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{c.user.full_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(c.lastMessageAt), "MMM d")}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                      {c.unread && <span className="size-2 rounded-full bg-primary shrink-0" />}
                      <span className="truncate">{c.lastMessage}</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex-col bg-background",
          selectedUserId ? "flex" : "hidden md:flex"
        )}>
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden shrink-0" 
                  onClick={() => setSelectedUserId(null)}
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={selectedUser?.avatar_url || ""} />
                  <AvatarFallback>{selectedUser?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="font-semibold truncate">{selectedUser?.full_name}</div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                {selectedConversationMessages.map((msg) => {
                  const isMine = msg.sender_id === profile?.id;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "max-w-[75%] rounded-2xl p-3 px-4",
                        isMine 
                          ? "bg-primary text-primary-foreground self-end rounded-br-none" 
                          : "bg-muted self-start rounded-bl-none"
                      )}
                    >
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      <div className={cn(
                        "text-[10px] mt-1 opacity-70",
                        isMine ? "text-right" : "text-left"
                      )}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-muted/10">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[44px] max-h-32 bg-background resize-none py-3"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (newMessage.trim()) sendMessage.mutate(newMessage);
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    className="shrink-0 h-[44px] w-[44px]"
                    onClick={() => sendMessage.mutate(newMessage)}
                    disabled={!newMessage.trim() || sendMessage.isPending}
                  >
                    <Send className="size-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="size-12 mb-4 opacity-20" />
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
        
      </div>
    </PageShell>
  );
}
