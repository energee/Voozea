-- Fix: Make actor_id nullable to support entity-based actors
-- When a business follows a user, we use actor_entity_id instead of actor_id

ALTER TABLE public.notifications
ALTER COLUMN actor_id DROP NOT NULL;
