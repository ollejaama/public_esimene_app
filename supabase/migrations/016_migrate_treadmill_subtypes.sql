-- Migrate existing treadmill_skiing tag to treadmill_classic
UPDATE activities
SET custom_sport_tag = 'treadmill_classic'
WHERE custom_sport_tag = 'treadmill_skiing';
