-- Actions and community events tables.

-- Actions ----------------------------------------------------------------
create table if not exists public.actions (
  id          uuid primary key default uuid_generate_v4(),
  article_id  uuid not null references public.articles(id) on delete cascade,
  kind        text not null check (kind in ('pressure','birddog','organize','testify','petition','amplify')),
  title       text not null,
  description text not null,
  url         text,
  cta_label   text,
  target      text
);

create index if not exists actions_article_id_idx on public.actions (article_id);

-- Events -----------------------------------------------------------------
create table if not exists public.community_events (
  id          uuid primary key default uuid_generate_v4(),
  article_id  uuid not null references public.articles(id) on delete cascade,
  title       text not null,
  description text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text not null,
  is_online   boolean not null default false,
  url         text,
  organizer   text
);

create index if not exists events_article_id_idx on public.community_events (article_id);

-- RLS --------------------------------------------------------------------
alter table public.actions enable row level security;
alter table public.community_events enable row level security;

drop policy if exists "actions read" on public.actions;
create policy "actions read" on public.actions for select using (true);

drop policy if exists "events read" on public.community_events;
create policy "events read" on public.community_events for select using (true);

-- Seed actions -----------------------------------------------------------
insert into public.actions (article_id, kind, title, description, target, cta_label, url) values
  -- Article 1 — Pilsen housing
  ('00000000-0000-0000-0000-000000000001', 'pressure',
   'Pack the Housing Committee hearing',
   'Bodies in chairs flip wavering aldermen. The committee meets next month at City Hall, room 201. The Pilsen Alliance is running a 4pm rally on the LaSalle steps before the hearing — wear red.',
   'Chicago Housing Committee', 'RSVP via Pilsen Alliance', 'https://example.org/pilsen-alliance'),
  ('00000000-0000-0000-0000-000000000001', 'birddog',
   'Bird-dog the three swing votes',
   'Reyes has six commitments and needs nine. Aldermen Curtis (12th), Vasquez (40th), and Rodriguez Sanchez (33rd) are reportedly undecided. Call their ward offices, name the ordinance, and ask for a yes.',
   'Curtis · Vasquez · Rodriguez Sanchez', 'Get the call script', 'https://example.org/swing-vote-script'),
  ('00000000-0000-0000-0000-000000000001', 'testify',
   'Submit public testimony — 90 seconds is enough',
   'Written testimony goes on the public record and is read by every alderman''s staff. The Pilsen Alliance has a 90-second template that names AMI math in real dollars so the chamber can''t dodge it.',
   'City Council clerk', 'Submit your testimony', 'https://example.org/testimony-template'),

  -- Article 2 — Baltimore jazz festival
  ('00000000-0000-0000-0000-000000000002', 'organize',
   'Sit on the Resident Advisory Council',
   'The Pennsylvania Avenue Black Arts District is taking applications for two open neighborhood seats. Developers eyeing the corridor have been showing up with checks. Push back from inside the room.',
   'Penn Ave BAED board', 'Apply for the seat', 'https://example.org/penn-ave-rac'),
  ('00000000-0000-0000-0000-000000000002', 'amplify',
   'Record an oral history with an elder this month',
   'The festival''s oral history tent only happens once. Memory is leaving the neighborhood faster than the festival can capture it. Eubie Blake is training community recorders May 11 — show up, leave with the equipment.',
   'Anyone with a grandparent who remembers the Royal Theater', 'Sign up for training', 'https://example.org/oral-history-may11'),
  ('00000000-0000-0000-0000-000000000002', 'pressure',
   'Demand the arts grant be made recurring',
   '$400k is one-time money. Year-round programming at Eubie Blake — youth horn lessons, recording sessions — runs on the grant''s leftovers. Email the Mayor''s Office of Arts & Culture and ask for a permanent line item.',
   'Mayor Brandon Scott · OAC', 'Email the OAC director', 'https://example.org/baltimore-oac'),

  -- Article 3 — DC charter expansion
  ('00000000-0000-0000-0000-000000000003', 'pressure',
   'Pack the May PCSB vote',
   'The Public Charter School Board votes mid-May. The room and the Zoom are both public. Pack both. ANC 7B and WTU are coordinating — tell them you''re showing.',
   'DC PCSB members', 'RSVP and get the dial-in', 'https://example.org/pcsb-may-vote'),
  ('00000000-0000-0000-0000-000000000003', 'testify',
   'Submit comment — demand the facilities study first',
   'The 2022 facilities equity study has been promised four times and delivered zero times. Public comment that names that delay is the strongest argument for delay on the vote.',
   'DC PCSB · Council Education Committee', 'Use the WTU template', 'https://example.org/wtu-comment-template'),
  ('00000000-0000-0000-0000-000000000003', 'organize',
   'Join the WTU coalition phone bank',
   'The Washington Teachers'' Union is bird-dogging At-Large Council members on charter-DCPS funding parity. Phone bank Tuesdays and Thursdays, 6-8pm. Training takes 15 minutes.',
   'At-Large Council members', 'Sign up to phone bank', 'https://example.org/wtu-phonebank'),

  -- Article 4 — Atlanta vaccine van
  ('00000000-0000-0000-0000-000000000004', 'birddog',
   'Call Senator Ossoff and Senator Warnock about HRSA',
   'The grant funding 40% of the van is up for reauthorization this fall. A 60-second call from a constituent in southwest Atlanta lands harder than a thousand emails. Script: keep the van running.',
   'Sens. Ossoff · Warnock', 'Get the 60-second script', 'https://example.org/hrsa-call-script'),
  ('00000000-0000-0000-0000-000000000004', 'pressure',
   'Show up to the Fulton County Board of Health',
   'The board meets the last Wednesday of every month and takes public comment. Demand mobile outreach become a permanent county line item — not a federally-funded variable. Three minutes is enough.',
   'Fulton Co Board of Health', 'Find the next meeting', 'https://example.org/fulton-boh'),
  ('00000000-0000-0000-0000-000000000004', 'organize',
   'Volunteer with Westside''s organizing arm',
   'Beyond the van, Westside Community Clinic runs a community health worker program. They train neighbors to navigate insurance, find specialists, fight denials. Saturday onboarding once a month.',
   'Westside Community Clinic', 'Sign up to be trained', 'https://example.org/westside-volunteer'),

  -- Article 5 — Detroit AI literacy
  ('00000000-0000-0000-0000-000000000005', 'amplify',
   'Run a deepfake-spotting workshop where you already gather',
   'DAAA will train a volunteer instructor in 90 minutes and ship you the curriculum. Run it at your church, union local, NAACP branch, library — wherever a roomful of elders trust you.',
   'Anyone with access to a room of elders', 'Request the curriculum', 'https://example.org/daaa-curriculum'),
  ('00000000-0000-0000-0000-000000000005', 'birddog',
   'Bird-dog Sens. Peters and Stabenow on the Deceptive AI Act',
   'Federal disclosure law for synthetic political media is stuck in committee. Michigan''s two senators are both winnable yes votes if pressured. Constituent calls are the only thing moving the needle.',
   'Sens. Peters · Stabenow', 'Get the 60-second script', 'https://example.org/deceptive-ai-act'),
  ('00000000-0000-0000-0000-000000000005', 'pressure',
   'Pressure your state AG on platform accountability',
   'The platforms are not going to fix themselves before November. State attorneys general have authority to demand synthetic-media disclosure on political ads. Michigan AG Nessel is publicly receptive. Push.',
   'AG Dana Nessel', 'Email AG Nessel''s office', 'https://example.org/ag-nessel');

-- Seed events ------------------------------------------------------------
insert into public.community_events (article_id, title, description, starts_at, ends_at, location, is_online, organizer, url) values
  -- Article 1
  ('00000000-0000-0000-0000-000000000001',
   'Anti-displacement march to the 25th Ward office',
   'Pilsen Alliance + parish councils. We march from Cermak/Damen to the ward office at 4pm. Bring a sign that names the AMI math in real dollars.',
   now() + interval '11 days 4 hours', null,
   'Cermak & Damen, Chicago, IL', false, 'Pilsen Alliance', 'https://example.org/march-may16'),
  ('00000000-0000-0000-0000-000000000001',
   'Housing Committee hearing — pack the room',
   'Public seating is first-come. The committee will likely vote out of committee that day. Lunch served by parish councils for early arrivals.',
   now() + interval '20 days', null,
   'Chicago City Hall, Room 201', false, 'Chicago Housing Committee', 'https://example.org/housing-hearing'),
  ('00000000-0000-0000-0000-000000000001',
   'Swing-vote phone bank (online)',
   'We''re calling 25th Ward neighbors of Curtis, Vasquez, and Rodriguez Sanchez voters. 15-minute training, then we call. Tuesdays and Thursdays.',
   now() + interval '2 days 18 hours', null,
   'Zoom', true, 'Pilsen Alliance', 'https://example.org/phonebank-zoom'),

  -- Article 2
  ('00000000-0000-0000-0000-000000000002',
   'Pennsylvania Avenue Jazz Festival',
   'Three blocks of outdoor stage, an oral history tent, free youth horn workshops, and reunion sets you have not heard since 2014.',
   now() + interval '52 days', now() + interval '54 days 6 hours',
   'Pennsylvania Ave between Dolphin & Laurens, Baltimore, MD', false, 'Penn Ave Black Arts District', 'https://example.org/penn-ave-fest'),
  ('00000000-0000-0000-0000-000000000002',
   'Oral history recorder training',
   'Eubie Blake Center is training neighborhood volunteers to record elders'' memories of the Royal Theater and the Avenue. Equipment provided. Saturdays in May.',
   now() + interval '13 days 4 hours', null,
   'Eubie Blake Cultural Center, Baltimore', false, 'Penn Ave Black Arts District', 'https://example.org/oral-history-may'),
  ('00000000-0000-0000-0000-000000000002',
   'Anti-displacement walking tour of the Avenue (online viewing too)',
   'Two-hour walking tour of the Avenue''s lost landmarks and the developers eyeing the lots now. Streamed live for folks outside the city.',
   now() + interval '6 days 4 hours', null,
   'Penn Ave & Lafayette · livestream', true, 'Baltimore Heritage', 'https://example.org/penn-ave-tour'),

  -- Article 3
  ('00000000-0000-0000-0000-000000000003',
   'DC PCSB final vote — public seating + Zoom',
   'Public comment opens 30 min before. ANC 7B is coordinating overflow seating at the Benning Library. Wear red if you''re with WTU.',
   now() + interval '15 days 6 hours', null,
   'DC PCSB, 3333 14th St NW + Zoom', true, 'DC PCSB', 'https://example.org/pcsb-vote'),
  ('00000000-0000-0000-0000-000000000003',
   'ANC 7B monthly meeting',
   'Commissioner Wallace will introduce a resolution asking PCSB to delay the vote pending the facilities study. Show up and back him.',
   now() + interval '8 days 5 hours', null,
   'Benning Library, Washington, DC', false, 'ANC 7B', 'https://example.org/anc-7b'),
  ('00000000-0000-0000-0000-000000000003',
   'WTU community pressure rally',
   'Outside the Wilson Building, before the Council education hearing. Speakers include parents from both DCPS and Compass.',
   now() + interval '18 days 4 hours', null,
   'Wilson Building, Washington, DC', false, 'Washington Teachers'' Union', 'https://example.org/wtu-rally'),

  -- Article 4
  ('00000000-0000-0000-0000-000000000004',
   'Fulton County Board of Health public comment',
   'Three minutes per speaker. Demand mobile outreach as a permanent county line item. Westside Clinic staff will be there in scrubs.',
   now() + interval '21 days 4 hours', null,
   'Fulton County Government Center, Atlanta, GA', false, 'Fulton Co Board of Health', 'https://example.org/fulton-boh-meeting'),
  ('00000000-0000-0000-0000-000000000004',
   'HRSA reauthorization national call-in day',
   'Coordinated with clinics across the country. 30,000 calls in one day. Script, talking points, and a button that dials your senators.',
   now() + interval '28 days', null,
   'Online — call from anywhere', true, 'Community Health Coalition', 'https://example.org/hrsa-callin'),
  ('00000000-0000-0000-0000-000000000004',
   'Mobile vaccine van — West Lake stop',
   'Free vaccinations, no insurance check, no paperwork hassles. Saturdays at the West Lake MARTA parking lot. Bring kids.',
   now() + interval '2 days 3 hours', null,
   'West Lake MARTA, Atlanta, GA', false, 'Westside Community Clinic', 'https://example.org/vaccine-van'),

  -- Article 5
  ('00000000-0000-0000-0000-000000000005',
   'AI Literacy class — open to anyone over 60',
   'Free. Computer lab. Camille Tate teaching. Wednesdays at 2pm. The class that misidentified the deepfake voicemail in the article — be the next student to catch it.',
   now() + interval '1 day 5 hours', null,
   'Northwest Activities Center, Detroit, MI', false, 'Detroit Area Agency on Aging', 'https://example.org/ai-literacy-class'),
  ('00000000-0000-0000-0000-000000000005',
   'Election integrity teach-in — hybrid',
   'Wayne State School of Information + DAAA. How synthetic media is showing up in the 2026 cycle, what''s working at the state level, what isn''t.',
   now() + interval '23 days 4 hours', null,
   'Wayne State + livestream', true, 'Wayne State School of Information', 'https://example.org/wsu-teachin'),
  ('00000000-0000-0000-0000-000000000005',
   'Volunteer instructor training',
   'Take this curriculum to your church / union / library. 90-minute training, equipment kit included. Second Saturday of every month.',
   now() + interval '11 days 4 hours', null,
   'DAAA office, Detroit, MI', false, 'Detroit Area Agency on Aging', 'https://example.org/instructor-training');
