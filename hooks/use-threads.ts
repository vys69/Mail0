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
      console.log(`📦 Using cached data for email ${id}`);
      return JSON.parse(cachedData) as ParsedMessage;
    }

    console.log(`🚀 Starting fetch for email ${id}...`);
    const response = await fetch(`${BASE_URL}/api/v1/mail/${id}`);
    const reader = response.body?.getReader();
    const contentLength = response.headers.get("Content-Length");

    if (!reader) {
      return $fetch(`/api/v1/mail/${id}`, {
        baseURL: BASE_URL,
      }).then((e) => {
        const data = e.data as ParsedMessage;
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        console.log(`✅ Completed fetch for email ${id}`);
        return data;
      });
    }

    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      receivedLength += value.length;

      if (contentLength) {
        const progress = ((receivedLength / parseInt(contentLength)) * 100).toFixed(2);
        console.log(`⏳ Email ${id}: ${progress}% downloaded...`);
      }
    }

    // Concatenate chunks into a single Uint8Array
    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    // Convert to text and parse JSON
    const text = new TextDecoder("utf-8").decode(allChunks);
    const data = JSON.parse(text) as ParsedMessage;

    // Cache the result
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    console.log(`✅ Completed fetch for email ${id}`);
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
