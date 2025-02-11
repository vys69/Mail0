"use client";
import { $fetch, useSession } from "@/lib/auth-client";
import { InitialThread, ParsedMessage } from "@/types";
import { BASE_URL } from "@/lib/constants";
import useSWR, { preload } from "swr";

// TODO: improve the filters
const fetchEmails = async (args: any[]) => {
  const [_, folder, query, max, labelIds] = args;

  let searchParams = new URLSearchParams();
  if (max) searchParams.set("max", max.toString());
  if (query) searchParams.set("q", query);
  if (folder) searchParams.set("folder", folder.toString());
  if (labelIds) searchParams.set("labelIds", labelIds.join(","));

  return (await $fetch("/api/v1/mail?" + searchParams.toString(), {
    baseURL: BASE_URL,
  }).then((e) => e.data)) as RawResponse;
};

// Based on gmail
interface RawResponse {
  nextPageToken: number;
  messages: InitialThread[];
  resultSizeEstimate: number;
}

const fetchEmail = async (args: any[]) => {
  const [userId, id] = args;

  try {
    const cacheKey = `email-${id}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      // Only use cache if it has all required fields
      if (parsed.processedHtml && parsed.blobUrl) {
        console.log(`📦 Using cached data for email ${id}`, {
          hasProcessedHtml: !!parsed.processedHtml,
          hasBlobUrl: !!parsed.blobUrl,
        });
        return parsed;
      } else {
        console.log(`🔄 Cache miss (incomplete data) for email ${id}, fetching fresh data...`);
      }
    }

    console.log(`🚀 Starting fetch for email ${id}...`);
    const response = await fetch(`${BASE_URL}/api/v1/mail/${id}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch email: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate the response data
    if (!data.processedHtml || !data.blobUrl) {
      console.error(`❌ Invalid email data for ${id}`, {
        hasProcessedHtml: !!data.processedHtml,
        hasBlobUrl: !!data.blobUrl,
      });
      throw new Error("Invalid email data received");
    }

    console.log(`✅ Successfully fetched email ${id}`, {
      hasProcessedHtml: true,
      hasBlobUrl: true,
      contentLength: data.processedHtml.length,
      blobUrlLength: data.blobUrl.length,
    });

    // Cache the complete data
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(`❌ Error fetching email ${id}:`, error);
    throw error;
  }
};

export const preloadThread = (userId: string, threadId: string) => {
  console.log(`🔄 Prefetching email ${threadId}...`);
  preload([userId, threadId], fetchEmail);
};

export const useThreads = (folder: string, labelIds?: string[], query?: string, max?: number) => {
  const { data: session } = useSession();
  const { data, isLoading, error } = useSWR<RawResponse>(
    [session?.user.id, folder, query, max, labelIds],
    fetchEmails,
  );

  return { data, isLoading, error };
};

export const useThread = (id: string) => {
  const { data: session } = useSession();
  const { data, isLoading, error } = useSWR<ParsedMessage>(
    session?.user.id ? [session.user.id, id] : null,
    fetchEmail,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  return { data, isLoading, error };
};
