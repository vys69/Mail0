import {
  Archive,
  ArchiveX,
  Forward,
  MoreVertical,
  Paperclip,
  Reply,
  ReplyAll,
  BellOff,
  X,
  Send,
  FileIcon,
  Copy,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import sanitizeHtml from "sanitize-html";
import { cn } from "@/lib/utils";
import React from "react";

import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMail } from "./use-mail";
import { Badge } from "../ui/badge";
import Image from "next/image";

interface MailResponse {
  id: string;
  title: string;
  tags: string[];
  sender: {
    name: string;
    email: string;
  };
  unread: boolean;
  receivedOn: string;
  body: string; // base64 encoded HTML
}

interface MailDisplayProps {
  mail: string | null;
  onClose?: () => void;
  isMobile?: boolean;
}

const ALLOWED_TAGS = [
  "p",
  "br",
  "b",
  "i",
  "em",
  "strong",
  "a",
  "img",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "pre",
  "code",
  "div",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
];

function fromBinary(str: string) {
  return decodeURIComponent(
    atob(str.replace(/-/g, "+").replace(/_/g, "/"))
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
}

export function MailDisplay({ mail, onClose, isMobile }: MailDisplayProps) {
  const [, setMail] = useMail();
  const [emailData, setEmailData] = useState<MailResponse | null>(null);
  const [decodedBody, setDecodedBody] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Cache for processed HTML blobs
  useEffect(() => {
    const blobCache = new Map<string, string>();

    return () => {
      // Cleanup blobs on unmount
      blobCache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    async function fetchEmail() {
      if (!mail) return;

      try {
        const cacheKey = `email-${mail}`;
        const cachedData = sessionStorage.getItem(cacheKey);

        if (cachedData) {
          console.log(`📦 Using cached email data for ${mail}`);
          setEmailData(JSON.parse(cachedData));
          return;
        }

        const response = await fetch(`/api/v1/mail/${mail}`);
        if (!response.ok) throw new Error("Failed to fetch email");

        const data = await response.json();
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        setEmailData(data);
      } catch (error) {
        console.error("Error fetching email:", error);
      }
    }

    fetchEmail();
  }, [mail]);

  useEffect(() => {
    if (emailData) {
      setIsMuted(emailData.unread ?? false);
    }
  }, [emailData]);

  useEffect(() => {
    if (!emailData?.body) return;

    try {
      // Check if we have a cached blob URL for this email
      const blobCacheKey = `blob-${emailData.id}`;
      const cachedBlobUrl = sessionStorage.getItem(blobCacheKey);

      if (cachedBlobUrl) {
        console.log(`📦 Using cached HTML blob for email ${emailData.id}`);
        setBlobUrl(cachedBlobUrl);
        return;
      }

      console.log(`🔄 Processing HTML for email ${emailData.id}...`);
      const decoded = fromBinary(emailData.body);
      const sanitized = sanitizeHtml(decoded, {
        allowedTags: ALLOWED_TAGS,
        allowedAttributes: {
          "*": ["class", "id", "style"],
          img: ["src", "alt", "title", "width", "height"],
          a: ["href", "target", "rel"],
          td: ["colspan", "rowspan"],
          th: ["colspan", "rowspan", "scope"],
        },
      });

      // Create a complete HTML document
      const htmlDocument = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                width: 100%;
                height: 100%;
                overflow-y: auto;
              }
              table {
                width: 100%;
              }
              img {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            ${sanitized}
          </body>
        </html>
      `;

      // Create a blob URL for the content
      const blob = new Blob([htmlDocument], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Cache the blob URL
      sessionStorage.setItem(blobCacheKey, url);
      console.log(`✨ Cached HTML blob for email ${emailData.id}`);

      setBlobUrl(url);

      return () => {
        if (url) {
          URL.revokeObjectURL(url);
          sessionStorage.removeItem(blobCacheKey);
        }
      };
    } catch (error) {
      console.error("Error processing email:", error);
    }
  }, [emailData?.body, emailData?.id]);

  const handleClose = useCallback(() => {
    onClose?.();
    setMail({ selected: null });
  }, [onClose, setMail]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleClose]);

  const handleAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setIsUploading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setAttachments([...attachments, ...Array.from(e.target.files)]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const truncateFileName = (name: string, maxLength = 15) => {
    if (name.length <= maxLength) return name;
    const extIndex = name.lastIndexOf(".");
    if (extIndex !== -1 && name.length - extIndex <= 5) {
      return `${name.slice(0, maxLength - 5)}...${name.slice(extIndex)}`;
    }
    return `${name.slice(0, maxLength)}...`;
  };

  const handleCopy = async () => {
    if (emailData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(emailData, null, 2));
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000); // Reset after 2 seconds
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  if (!emailData) return <div>Loading...</div>;

  if (!blobUrl) return null;

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-full flex-col", isMobile ? "" : "rounded-r-lg pt-[6px]")}>
        <div className="sticky top-0 z-20 flex items-center gap-2 border-b bg-background/95 px-4 pb-[7.5px] pt-[0.5px] backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-1 items-center gap-2">
            {!isMobile && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="md:h-fit md:px-2"
                    disabled={!emailData}
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            )}
            <div className="max-w-[300px] flex-1 truncate text-sm font-medium">
              {emailData.title || "No subject"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="md:h-fit md:px-2"
                  disabled={!emailData}
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy email data</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copySuccess ? "Copied!" : "Copy email data"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="md:h-fit md:px-2" disabled={!emailData}>
                  <Archive className="h-4 w-4" />
                  <span className="sr-only">Archive</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="md:h-fit md:px-2" disabled={!emailData}>
                  <Reply className="h-4 w-4" />
                  <span className="sr-only">Reply</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="md:h-fit md:px-2" disabled={!emailData}>
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <ArchiveX className="mr-2 h-4 w-4" /> Move to spam
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ReplyAll className="mr-2 h-4 w-4" /> Reply all
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="mr-2 h-4 w-4" /> Forward
                </DropdownMenuItem>
                <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                <DropdownMenuItem>Add label</DropdownMenuItem>
                <DropdownMenuItem>Mute thread</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 overflow-y-auto pb-[calc(120px+2rem)]">
            <div className="flex flex-col gap-4 px-4 py-4">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage alt={emailData.sender.name} />
                  <AvatarFallback>
                    {emailData.sender.name
                      .split(" ")
                      .map((chunk) => chunk[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="font-semibold">{emailData.sender.name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{emailData.sender.email}</span>
                    {isMuted && <BellOff className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="h-full w-full p-0">
              <div className="flex h-full w-full flex-1 flex-col p-0">
                {blobUrl ? (
                  <iframe
                    key={emailData.id}
                    src={blobUrl}
                    className="w-full flex-1 border-none opacity-100 transition-opacity duration-200"
                    title="Email Content"
                    sandbox="allow-same-origin"
                    style={{
                      minHeight: "500px",
                      height: "100%",
                      overflow: "auto",
                    }}
                  />
                ) : (
                  <div
                    className="flex h-[500px] w-full items-center justify-center"
                    style={{ minHeight: "500px" }}
                  >
                    <div className="h-32 w-32 animate-pulse rounded-full bg-secondary" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-10 bg-background px-4 pb-4 pt-2">
            <form className="relative space-y-2.5 rounded-[calc(var(--radius)-2px)] border bg-secondary/50 p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4" />
                  <p className="truncate">
                    {emailData?.sender.name} ({emailData?.sender.email})
                  </p>
                </div>
              </div>

              <Textarea
                className="min-h-[60px] w-full resize-none border-0 bg-[#18181A] leading-relaxed placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0 md:text-base"
                placeholder="Write your reply..."
                spellCheck={true}
                autoFocus
              />

              {(attachments.length > 0 || isUploading) && (
                <div className="relative z-50 min-h-[32px]">
                  <div className="hide-scrollbar absolute inset-x-0 flex gap-2 overflow-x-auto">
                    {isUploading && (
                      <Badge
                        variant="secondary"
                        className="inline-flex shrink-0 animate-pulse items-center bg-background/50 px-2 py-1.5 text-xs"
                      >
                        Uploading...
                      </Badge>
                    )}
                    {attachments.map((file, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Badge
                            key={index}
                            variant="secondary"
                            className="inline-flex shrink-0 items-center gap-1 bg-background/50 px-2 py-1.5 text-xs"
                          >
                            <span className="max-w-[120px] truncate">
                              {truncateFileName(file.name)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-1 h-4 w-4 hover:bg-background/80"
                              onClick={(e) => {
                                e.preventDefault();
                                removeAttachment(index);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="w-64 p-0">
                          <div className="relative h-32 w-full">
                            {file.type.startsWith("image/") ? (
                              <Image
                                src={URL.createObjectURL(file) || "/placeholder.svg"}
                                alt={file.name}
                                fill
                                className="rounded-t-md object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center p-4">
                                <FileIcon className="h-16 w-16 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="bg-secondary p-2">
                            <p className="text-sm font-medium">{truncateFileName(file.name, 30)}</p>
                            <p className="text-xs text-muted-foreground">
                              Size: {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Last modified: {new Date(file.lastModified).toLocaleDateString()}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-8 w-8 hover:bg-background/80"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById("attachment-input")?.click();
                        }}
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">Add attachment</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach file</TooltipContent>
                  </Tooltip>
                  <input
                    type="file"
                    id="attachment-input"
                    className="hidden"
                    onChange={handleAttachment}
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8">
                    Save draft
                  </Button>
                  <Button size="sm" className="h-8">
                    Send <Send className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

<style jsx global>{`
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`}</style>;
