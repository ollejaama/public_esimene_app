CREATE TABLE IF NOT EXISTS team_members (
  team_id   UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  left_at    TIMESTAMPTZ,
  PRIMARY KEY (team_id, athlete_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_coach" ON team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM teams WHERE id = team_id AND coach_id = auth.uid())
);
CREATE POLICY "team_members_athlete" ON team_members FOR SELECT USING (auth.uid() = athlete_id);
