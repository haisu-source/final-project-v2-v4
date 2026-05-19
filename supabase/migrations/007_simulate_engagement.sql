-- Simulate engagement for a 500-person community.
--
-- Populates likes and views with realistic shape so the trending sort, the
-- engagement counters, and the Catch-Me-Up summary all stop looking like
-- a freshly-seeded demo.
--
-- - 500 synthetic users (sim_user_001..sim_user_500)
-- - Likes follow a power-law: earlier comments in each thread accrue more,
--   replies less. Capped at 380/comment so no single comment dominates.
-- - Like timestamps fall between each comment's own created_at and now().
-- - Views: 800–2200 per article, with unique viewer_hash so the existing
--   (article_id, viewer_hash) unique constraint dedupes naturally.
-- - Guarded: if the table already has substantial data, skip — running the
--   migration twice will not pile on another round.

-- LIKES -------------------------------------------------------------------
do $$
declare
  cur_likes int;
begin
  select count(*) into cur_likes from public.likes;
  if cur_likes > 500 then
    raise notice '[007] likes already seeded (% rows) — skipping', cur_likes;
    return;
  end if;

  with ranked as (
    select id, article_id, created_at,
           row_number() over (partition by article_id order by created_at) as rn
    from public.comments
  ),
  sized as (
    select id, created_at,
           -- Power-law target. rn=1 ~146, rn=2 ~88, rn=10 ~22, rn=17 ~12,
           -- then jittered ±70%. Hard cap at 380 keeps any one comment from
           -- swallowing the 500-user pool.
           greatest(0, least(380,
             floor((220.0 / (rn + 0.5)) * (0.3 + random() * 1.4))::int
           )) as target
    from ranked
  )
  insert into public.likes (comment_id, user_id, created_at)
  select
    s.id,
    'sim_user_' || lpad((floor(random() * 500)::int + 1)::text, 3, '0'),
    s.created_at + (random() * (now() - s.created_at))
  from sized s
  cross join lateral generate_series(1, s.target) g
  on conflict (comment_id, user_id) do nothing;

  select count(*) into cur_likes from public.likes;
  raise notice '[007] likes after seed: %', cur_likes;
end $$;

-- VIEWS -------------------------------------------------------------------
do $$
declare
  cur_views int;
begin
  select count(*) into cur_views from public.views;
  if cur_views > 1000 then
    raise notice '[007] views already seeded (% rows) — skipping', cur_views;
    return;
  end if;

  insert into public.views (article_id, viewer_hash, created_at)
  select
    a.id,
    -- Unique-enough viewer hash. Combines article id, an index, a random,
    -- and clock_timestamp so reruns generate fresh hashes if needed.
    md5(a.id::text || g::text || random()::text || clock_timestamp()::text),
    a.created_at + (random() * (now() - a.created_at))
  from public.articles a
  cross join lateral generate_series(
    1,
    -- Per-article volume jittered between ~800 and ~2200.
    (800 + (random() * 1400))::int
  ) g
  on conflict (article_id, viewer_hash) do nothing;

  select count(*) into cur_views from public.views;
  raise notice '[007] views after seed: %', cur_views;
end $$;
