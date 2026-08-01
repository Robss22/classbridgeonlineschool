-- Migration 003: Seed the two core curricula (Cambridge and UNEB)

BEGIN;

INSERT INTO curricula (curriculum_id, name, description) VALUES
  (1, 'Cambridge Assessment International Education', 'Cambridge International Examinations (CIE) curriculum standards'),
  (2, 'UNEB (Uganda National Examinations Board)', 'Uganda National Examinations Board curriculum standards')
ON CONFLICT (name) DO NOTHING;

COMMIT;
