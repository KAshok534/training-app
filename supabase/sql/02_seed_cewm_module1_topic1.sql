-- ─────────────────────────────────────────────────────────────────────────────
-- CEWM (course_id = 1) → Module 1 → Topic 1: Foundations of Ecosystems
-- 44-slide image slideshow + 25-question assessment
-- Run AFTER 01_assessment_schema.sql
-- Safe to re-run: uses ON CONFLICT to upsert; questions are wiped + reseeded.
-- options column is jsonb in the existing schema — arrays cast via ::jsonb
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Module row (slideshow type)
insert into modules (
  id, course_id, title, type, duration_label, duration_mins,
  order_index, description, slide_count, slide_base_url
) values (
  1001, 1, 'Topic 1 — Foundations of Ecosystems',
  'slideshow', '90 min', 90, 1,
  'Introduction to ecology and ecosystems: components, energy flow, food chains and webs, biogeochemical cycles, biodiversity, and ecosystem services.',
  44, '/course-content/cewm/module-1/topic-1'
)
on conflict (id) do update set
  title          = excluded.title,
  type           = excluded.type,
  duration_label = excluded.duration_label,
  duration_mins  = excluded.duration_mins,
  description    = excluded.description,
  slide_count    = excluded.slide_count,
  slide_base_url = excluded.slide_base_url;

-- 2. Questions — wipe and reseed (safe for re-runs)
delete from questions where module_id = 1001;

-- correct_id mirrors correct_index (both columns exist in the schema; correct_id is NOT NULL)
insert into questions (module_id, order_index, question_text, options, correct_index, correct_id, topic_tag) values
(1001, 1,  'What is ecology?',
   '["The study of rocks and minerals","The study of organisms and their environment","The study of human societies","The study of weather"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 2,  'Which of these is a biotic component of an ecosystem?',
   '["Sunlight","Water","Plants","Soil"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 3,  'Which of the following is an abiotic factor?',
   '["Bacteria","Fungi","Temperature","Animals"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 4,  'Producers in an ecosystem are also called',
   '["Heterotrophs","Decomposers","Autotrophs","Consumers"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 5,  'Which organism is a primary consumer?',
   '["Cow","Tiger","Eagle","Snake"]'::jsonb, 0, 0, 'foundations-of-ecosystems'),
(1001, 6,  'Which of these is a decomposer?',
   '["Lion","Fungi","Deer","Rabbit"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 7,  'Energy in an ecosystem flows in which direction?',
   '["Cyclic","Reversible","Unidirectional","Bidirectional"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 8,  'The ultimate source of energy in an ecosystem is',
   '["Water","Sun","Soil","Wind"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 9,  'Which level of the food chain has the maximum energy?',
   '["Tertiary consumers","Producers","Secondary consumers","Decomposers"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 10, 'Which of the following is a food chain?',
   '["Sun \u2192 Lion \u2192 Grass","Grass \u2192 Lion \u2192 Deer","Grass \u2192 Deer \u2192 Lion","Deer \u2192 Grass \u2192 Lion"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 11, 'A food web is',
   '["A single chain of organisms","A group of producers","Interconnected food chains","Only carnivores"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 12, 'Which of these is a terrestrial ecosystem?',
   '["Pond","Forest","Ocean","River"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 13, 'Which is an aquatic ecosystem?',
   '["Desert","Grassland","Pond","Forest"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 14, 'The role of decomposers is to',
   '["Produce food","Break down dead matter","Hunt animals","Provide oxygen"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 15, 'Which gas is mainly involved in photosynthesis?',
   '["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 16, 'The water cycle is also known as',
   '["Carbon cycle","Nitrogen cycle","Hydrological cycle","Oxygen cycle"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 17, 'Which cycle involves nitrogen fixation by bacteria?',
   '["Carbon cycle","Nitrogen cycle","Sulphur cycle","Oxygen cycle"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 18, 'Carbon cycle is important because',
   '["It produces oxygen","It maintains atmospheric balance","It removes pollution","It causes rain"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 19, 'Biodiversity refers to',
   '["Number of plants only","Number of animals only","Variety of life forms in an area","Variety of rocks"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 20, 'Which is an example of an ecosystem service?',
   '["Fuel from minerals","Water from soil","Pollination by bees","Light from the sun"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 21, 'Bioaccumulation is the process of',
   '["Recycling of nutrients","Buildup of toxins in one organism","Reproduction of organisms","Decomposition of waste"]'::jsonb, 1, 1, 'foundations-of-ecosystems'),
(1001, 22, 'Biomagnification means',
   '["Toxins decrease at higher levels","Toxins remain constant","Toxin concentration increases up the food chain","Toxins are removed by plants"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 23, 'Which of the following is a renewable resource?',
   '["Coal","Petroleum","Solar energy","Natural gas"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 24, 'Which is a non-renewable resource?',
   '["Wind","Sunlight","Coal","Water"]'::jsonb, 2, 2, 'foundations-of-ecosystems'),
(1001, 25, 'Sustainable development means',
   '["Using all resources quickly","Meeting present needs without harming future needs","Stopping all industries","Cutting trees for development"]'::jsonb, 1, 1, 'foundations-of-ecosystems');

-- Verify
select count(*) as question_count from questions where module_id = 1001;
