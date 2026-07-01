/**
 * founderIdeas.ts
 * Supabase-backed founder idea management for the Control Room.
 * Ideas live in the `founder_ideas` table, owner-scoped by RLS.
 */
import { supabase } from '@/lib/supabase';

export type IdeaStatus =
  | 'backlog'
  | 'researching'
  | 'planned'
  | 'building'
  | 'testing'
  | 'shipped'
  | 'paused'
  | 'rejected';

export interface FounderIdea {
  id: string;
  title: string;
  notes?: string;
  status: IdeaStatus;
  category?: string;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateIdeaInput {
  title: string;
  status?: IdeaStatus;
  notes?: string;
  category?: string;
  priority?: number;
}

/**
 * SQL to create the founder_ideas table (run once in Supabase):
 *
 * create table if not exists public.founder_ideas (
 *   id          uuid primary key default gen_random_uuid(),
 *   user_id     uuid not null references auth.users(id) on delete cascade,
 *   title       text not null,
 *   notes       text,
 *   status      text not null default 'backlog',
 *   category    text,
 *   priority    integer default 0,
 *   created_at  timestamptz not null default now(),
 *   updated_at  timestamptz not null default now()
 * );
 *
 * alter table public.founder_ideas enable row level security;
 *
 * create policy "Founder: own ideas only"
 *   on public.founder_ideas
 *   for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 *
 * create index on public.founder_ideas (user_id, created_at desc);
 */

function isValidStatus(s: unknown): s is IdeaStatus {
  return [
    'backlog', 'researching', 'planned', 'building',
    'testing', 'shipped', 'paused', 'rejected',
  ].includes(s as string);
}

export const founderIdeasService = {
  /** Fetch all ideas for the signed-in founder, newest first. */
  async list(): Promise<FounderIdea[]> {
    const { data, error } = await supabase
      .from('founder_ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[founderIdeas] list error:', error.message);
      return [];
    }
    return (data ?? []) as FounderIdea[];
  },

  /** Create a new idea. */
  async create(input: CreateIdeaInput): Promise<FounderIdea | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('[founderIdeas] create: no authenticated user');
      return null;
    }

    const { data, error } = await supabase
      .from('founder_ideas')
      .insert({
        user_id:  user.id,
        title:    input.title.trim(),
        notes:    input.notes ?? null,
        status:   input.status ?? 'backlog',
        category: input.category ?? null,
        priority: input.priority ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.warn('[founderIdeas] create error:', error.message);
      return null;
    }
    return data as FounderIdea;
  },

  /** Update an idea's status. */
  async updateStatus(id: string, status: IdeaStatus): Promise<boolean> {
    if (!isValidStatus(status)) {
      console.warn('[founderIdeas] invalid status:', status);
      return false;
    }
    const { error } = await supabase
      .from('founder_ideas')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.warn('[founderIdeas] updateStatus error:', error.message);
      return false;
    }
    return true;
  },

  /** Update notes on an existing idea. */
  async updateNotes(id: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('founder_ideas')
      .update({ notes: notes.trim(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.warn('[founderIdeas] updateNotes error:', error.message);
      return false;
    }
    return true;
  },

  /** Delete an idea permanently. */
  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('founder_ideas')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[founderIdeas] remove error:', error.message);
      return false;
    }
    return true;
  },
};
