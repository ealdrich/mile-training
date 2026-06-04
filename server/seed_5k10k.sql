-- Seed 5k/10k workouts
-- category key must match frontend: 'fiveKTenK'

INSERT INTO workout_library (id, name, nickname, description, rx, category, version, is_custom)
VALUES
  (
    'fk1',
    '12x400m',
    'The Dozen',
    '12 x 400m with 200m jog recoveries — high-volume speed-endurance cornerstone of 5k/10k training',
    '12 x 400m @ 5k pace w/ 200m jog recovery between each',
    'fiveKTenK', 1, false
  ),
  (
    'fk2',
    '5x1000m',
    'Five Thousands',
    '5 x 1000m with 400m jog recoveries — sustained 5k-pace work building aerobic power',
    '5 x 1000m @ 5k pace w/ 400m jog recovery between each',
    'fiveKTenK', 1, false
  ),
  (
    'fk3',
    '5x(600m/200m)',
    'The 600/200 Set',
    '5 sets of 600m + 200m — 200m jog after the 600m, 400m jog after the 200m; blends 5k pace with a faster surge',
    '5 x (600m @ 5k pace, 200m jog, 200m @ mile pace) w/ 400m jog between sets',
    'fiveKTenK', 1, false
  ),
  (
    'fk4',
    '1200 / 2000 / 800 / 1600',
    'The Big 4',
    'Four reps at varying distances with varied recoveries — builds range across 5k and 10k pace zones',
    '1200m @ 5k pace w/ 400m jog, 2000m @ 10k pace w/ 800m jog, 800m @ 5k pace w/ 400m jog, 1600m @ 5k pace w/ 400m jog',
    'fiveKTenK', 1, false
  ),
  (
    'fk5',
    '4x400 / 1600 / 4x400',
    'Sustained 400s',
    '4x400m, then 1600m, then 4x400m — 200m jog recoveries throughout except 800m jog before and after the 1600m',
    '4 x 400m @ 5k pace w/ 200m jog, 800m jog, 1600m @ 10k pace, 800m jog, 4 x 400m @ 5k pace w/ 200m jog',
    'fiveKTenK', 1, false
  ),
  (
    'fk6',
    '2x400 / 2x800 / 2x1200 / 2x800 / 2x400',
    'The Ladder',
    'Up-and-down ladder from 400m to 1200m and back — 200m jog after 400s, 400m jog after 800s and 1200s',
    '2x400m @ mile pace w/ 200m jog, 2x800m @ 5k pace w/ 400m jog, 2x1200m @ 5k pace w/ 400m jog, 2x800m @ 5k pace w/ 400m jog, 2x400m @ mile pace w/ 200m jog',
    'fiveKTenK', 1, false
  )
ON CONFLICT (id) DO NOTHING;
