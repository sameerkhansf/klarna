import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  Edit3,
  Trash2,
  Check,
  X,
  User,
  Clock,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  company_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  is_edited: boolean;
  user_email: string;
  user_name: string;
}

interface CommentSectionProps {
  companyId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  companyId,
}) => {
  const { user, loading: userLoading } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch comments
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("investment_comments_with_users")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchComments();
    }
  }, [companyId]);

  // Real-time subscription for comments
  useEffect(() => {
    if (!companyId) return;

    const subscription = supabase
      .channel(`comments_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "investment_comments",
          filter: `company_id=eq.${companyId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [companyId]);

  // Add new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("investment_comments").insert({
        company_id: companyId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Edit comment
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || !user) return;

    try {
      const { error } = await supabase
        .from("investment_comments")
        .update({
          content: editContent.trim(),
          is_edited: true,
        })
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
      setEditingId(null);
      setEditContent("");
      fetchComments();
    } catch (error) {
      console.error("Error editing comment:", error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("investment_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Start editing
  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (userLoading) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-gray-500">
          Loading...
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-gray-500">
          Please log in to view and add comments.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <MessageCircle className="h-5 w-5 mr-2 text-blue-600" />
          Discussion & Comments
          <Badge variant="outline" className="ml-2">
            {comments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new comment form */}
        <form onSubmit={handleAddComment} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your thoughts on this investment opportunity..."
            className="min-h-[80px] resize-none"
            disabled={submitting}
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>

        {/* Comments list */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4 text-gray-500">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* User avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">
                          {getInitials(comment.user_name)}
                        </span>
                      </div>
                    </div>

                    {/* Comment content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimeAgo(comment.created_at)}
                        </span>
                        {comment.is_edited && (
                          <Badge variant="outline" className="text-xs">
                            Edited
                          </Badge>
                        )}
                      </div>

                      {/* Comment text or edit form */}
                      {editingId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px] resize-none text-sm"
                          />
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleEditComment(comment.id)}
                              disabled={!editContent.trim()}
                              className="h-7 px-2 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                              className="h-7 px-2 text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions menu for comment owner */}
                  {comment.user_id === user?.id && editingId !== comment.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-200"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() => startEditing(comment)}
                          className="text-sm"
                        >
                          <Edit3 className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
