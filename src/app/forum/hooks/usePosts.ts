"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export type Author = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

export type Attachment = {
  id: string;
  post_id: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  is_deleted: boolean;
  edited_at: string | null;
  like_count: number;
  created_at: string;
  updated_at: string;
  author: Author;
  userVote?: 1 | -1 | null;
  replies?: Comment[];
};

export type Post = {
  id: string;
  author_id: string;
  category_id: string;
  title: string;
  content: string;
  is_deleted: boolean;
  edited_at: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author: Author;
  category: Category;
  userVote?: 1 | -1 | null;
  userBookmarked?: boolean;
  attachments?: Attachment[];
};

export type SortOption = "newest" | "popular";

export function usePosts(
  categorySlug?: string,
  sort: SortOption = "newest",
  search?: string,
  categoryIds?: string[]
) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (categoryIds && categoryIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from("posts")
        .select(`
          *,
          author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified),
          category:categories!posts_category_id_fkey(id, name, slug, description)
        `)
        .eq("is_deleted", false);

      if (categorySlug) {
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categorySlug)
          .single();
        if (cat) query = query.eq("category_id", cat.id);
      }

      if (categoryIds && categoryIds.length > 0) {
        query = query.in("category_id", categoryIds);
      }

      if (search?.trim()) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      if (sort === "popular") {
        query = query.order("like_count", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      let postsWithMeta = (data as Post[]) || [];

      if (postsWithMeta.length > 0) {
        const postIds = postsWithMeta.map((p) => p.id);

        // Always fetch attachments (no auth required for reading)
        const { data: attachments } = await supabase
          .from("post_attachments")
          .select("*")
          .in("post_id", postIds);

        const attachmentMap = new Map<string, Attachment[]>();
        (attachments || []).forEach((a) => {
          if (!attachmentMap.has(a.post_id)) attachmentMap.set(a.post_id, []);
          attachmentMap.get(a.post_id)!.push(a);
        });

        if (user) {
          const [{ data: likes }, { data: bookmarks }] = await Promise.all([
            supabase
              .from("likes")
              .select("target_id, direction")
              .eq("user_id", user.id)
              .eq("target_type", "post")
              .in("target_id", postIds),
            supabase
              .from("bookmarks")
              .select("post_id")
              .eq("user_id", user.id)
              .in("post_id", postIds),
          ]);

          const voteMap = new Map<string, 1 | -1>(
            (likes || []).map((l) => [l.target_id, Number(l.direction) as 1 | -1])
          );
          const bookmarkedIds = new Set((bookmarks || []).map((b) => b.post_id));

          postsWithMeta = postsWithMeta.map((p) => ({
            ...p,
            userVote: voteMap.get(p.id) ?? null,
            userBookmarked: bookmarkedIds.has(p.id),
            attachments: attachmentMap.get(p.id) ?? [],
          }));
        } else {
          postsWithMeta = postsWithMeta.map((p) => ({
            ...p,
            attachments: attachmentMap.get(p.id) ?? [],
          }));
        }
      }

      setPosts(postsWithMeta);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [categorySlug, sort, search, categoryIds]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, error, refetch: fetchPosts };
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }

    async function fetchComments() {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:profiles!comments_author_id_fkey(id, username, display_name, avatar_url, is_verified)
        `)
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      let flat = data as Comment[];

      if (user && flat.length > 0) {
        const commentIds = flat.map((c) => c.id);
        const { data: votes } = await supabase
          .from("likes")
          .select("target_id, direction")
          .eq("user_id", user.id)
          .eq("target_type", "comment")
          .in("target_id", commentIds);

        const voteMap = new Map<string, 1 | -1>(
          (votes || []).map((v) => [v.target_id, Number(v.direction) as 1 | -1])
        );

        flat = flat.map((c) => ({ ...c, userVote: voteMap.get(c.id) ?? null }));
      }

      const map = new Map<string, Comment>();
      const roots: Comment[] = [];

      flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
      map.forEach((c) => {
        if (c.parent_id && map.has(c.parent_id)) {
          map.get(c.parent_id)!.replies!.push(c);
        } else {
          roots.push(c);
        }
      });

      setComments(roots);
      setLoading(false);
    }

    fetchComments();
  }, [postId]);

  return { comments, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("name")
      .then(({ data }) => setCategories(data || []));
  }, []);

  return { categories };
}

export function useCategory(slug: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCategory = useCallback(async () => {
    setLoading(true);

    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!data) {
      setCategory(null);
      setMemberCount(0);
      setLoading(false);
      return;
    }

    const { count } = await supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("category_id", data.id);

    setCategory(data);
    setMemberCount(count ?? 0);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return { category, memberCount, loading, refetch: fetchCategory };
}

export function useCommunityMembership(userId: string | null) {
  const [joinedCategoryIds, setJoinedCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemberships = useCallback(async () => {
    if (!userId) {
      setJoinedCategoryIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await supabase
      .from("community_members")
      .select("category_id")
      .eq("user_id", userId);

    setJoinedCategoryIds((data || []).map((row) => row.category_id));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  async function join(categoryId: string) {
    if (!userId) return;

    setJoinedCategoryIds((ids) => Array.from(new Set([...ids, categoryId])));

    const { error } = await supabase
      .from("community_members")
      .upsert(
        { user_id: userId, category_id: categoryId },
        { onConflict: "user_id,category_id" }
      );

    if (error) {
      await fetchMemberships();
    }
  }

  async function leave(categoryId: string) {
    if (!userId) return;

    const previousIds = joinedCategoryIds;
    setJoinedCategoryIds((ids) => ids.filter((id) => id !== categoryId));

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("user_id", userId)
      .eq("category_id", categoryId);

    if (error) {
      setJoinedCategoryIds(previousIds);
    }
  }

  return {
    joinedCategoryIds,
    loading,
    refetch: fetchMemberships,
    join,
    leave,
    isJoined: (categoryId: string) => joinedCategoryIds.includes(categoryId),
  };
}