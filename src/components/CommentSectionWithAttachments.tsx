import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Send,
  Edit3,
  Trash2,
  Check,
  X,
  Clock,
  MoreVertical,
  Paperclip,
  Download,
  Eye,
  FileX,
  Upload,
  Image,
  File,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  uploadFileToStorage,
  saveAttachmentToDatabase,
  deleteFileFromStorage,
  deleteAttachmentFromDatabase,
  getAttachmentsForComment,
  validateFile,
  formatFileSize,
  getFileIcon,
  type AttachmentData,
} from "@/lib/fileUpload";

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
  attachment_count: number;
  attachments?: AttachmentData[];
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch comments with attachments
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments_with_attachments")
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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comment_attachments",
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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      alert("Some files were rejected:\n" + errors.join("\n"));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files for a comment
  const uploadFilesForComment = async (
    commentId: string,
    files: File[]
  ): Promise<AttachmentData[]> => {
    const uploadedAttachments: AttachmentData[] = [];

    for (const file of files) {
      try {
        // Upload to storage
        const uploadResult = await uploadFileToStorage(
          file,
          user!.id,
          commentId
        );

        if (!uploadResult.success || !uploadResult.url || !uploadResult.path) {
          console.error("Failed to upload file:", uploadResult.error);
          continue;
        }

        // Save to database
        const dbResult = await saveAttachmentToDatabase(
          commentId,
          user!.id,
          file,
          uploadResult.url,
          uploadResult.path
        );

        if (dbResult.success && dbResult.attachment) {
          uploadedAttachments.push(dbResult.attachment);
        }
      } catch (error) {
        console.error("Error uploading file:", file.name, error);
      }
    }

    return uploadedAttachments;
  };

  // Add new comment with attachments
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (!newComment.trim() && selectedFiles.length === 0) ||
      !user ||
      submitting
    )
      return;

    setSubmitting(true);
    setUploadingFiles(true);

    try {
      // First, create the comment
      const { data: commentData, error: commentError } = await supabase
        .from("investment_comments")
        .insert({
          company_id: companyId,
          user_id: user.id,
          content: newComment.trim() || "File attachment",
        })
        .select()
        .single();

      if (commentError) throw commentError;

      // Upload files if any
      if (selectedFiles.length > 0) {
        await uploadFilesForComment(commentData.id, selectedFiles);
      }

      setNewComment("");
      setSelectedFiles([]);
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
      setUploadingFiles(false);
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

  // Delete comment and its attachments
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      // Get attachments first to delete from storage
      const comment = comments.find((c) => c.id === commentId);
      if (comment?.attachments) {
        for (const attachment of comment.attachments) {
          const { data: storageData } = await supabase
            .from("comment_attachments")
            .select("storage_path")
            .eq("id", attachment.id)
            .single();

          if (storageData?.storage_path) {
            await deleteFileFromStorage(storageData.storage_path);
          }
        }
      }

      // Delete comment (attachments will be deleted by CASCADE)
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

  // Delete individual attachment
  const handleDeleteAttachment = async (
    attachmentId: string,
    storagePath: string
  ) => {
    if (!user) return;

    try {
      // Delete from storage
      await deleteFileFromStorage(storagePath);

      // Delete from database
      await deleteAttachmentFromDatabase(attachmentId);

      fetchComments();
    } catch (error) {
      console.error("Error deleting attachment:", error);
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

  const isImageFile = (fileType: string) => {
    return fileType.startsWith("image/");
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

          {/* File attachment section */}
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Paperclip className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Attachments
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.json"
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div>
                        <div className="text-sm font-medium">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSelectedFile(index)}
                      disabled={submitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                (!newComment.trim() && selectedFiles.length === 0) || submitting
              }
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting
                ? uploadingFiles
                  ? "Uploading..."
                  : "Posting..."
                : "Post Comment"}
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
                        {comment.attachment_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Paperclip className="h-3 w-3 mr-1" />
                            {comment.attachment_count}
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
                        <>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">
                            {comment.content}
                          </p>

                          {/* Attachments */}
                          {comment.attachments &&
                            comment.attachments.length > 0 && (
                              <div className="space-y-2">
                                {comment.attachments.map((attachment) => (
                                  <div
                                    key={attachment.id}
                                    className="flex items-center justify-between bg-white p-2 rounded border"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">
                                        {getFileIcon(attachment.file_type)}
                                      </span>
                                      <div>
                                        <div className="text-sm font-medium">
                                          {attachment.file_name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {formatFileSize(attachment.file_size)}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      {isImageFile(attachment.file_type) && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            window.open(
                                              attachment.url,
                                              "_blank"
                                            )
                                          }
                                          className="h-7 px-2"
                                        >
                                          <Eye className="h-3 w-3" />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const link =
                                            document.createElement("a");
                                          link.href = attachment.url;
                                          link.download = attachment.file_name;
                                          link.click();
                                        }}
                                        className="h-7 px-2"
                                      >
                                        <Download className="h-3 w-3" />
                                      </Button>
                                      {comment.user_id === user?.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (
                                              confirm("Delete this attachment?")
                                            ) {
                                              // Get storage path from database
                                              supabase
                                                .from("comment_attachments")
                                                .select("storage_path")
                                                .eq("id", attachment.id)
                                                .single()
                                                .then(({ data }) => {
                                                  if (data?.storage_path) {
                                                    handleDeleteAttachment(
                                                      attachment.id,
                                                      data.storage_path
                                                    );
                                                  }
                                                });
                                            }
                                          }}
                                          className="h-7 px-2 text-red-600 hover:text-red-700"
                                        >
                                          <FileX className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </>
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
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this comment and all its attachments?"
                              )
                            ) {
                              handleDeleteComment(comment.id);
                            }
                          }}
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
