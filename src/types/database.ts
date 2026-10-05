export interface Crew {
  id: string;
  name: string;
  category: 'star' | 'bora' | 'other';
  tier?: 'major' | 'minor';
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Streamer {
  id: string;
  soop_id: string;
  nickname: string;
  profile_image_url?: string | null;
  crew_id?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BalloonSnapshot {
  id: number;
  streamer_id: string;
  total_stars: number;
  total_minutes: number;
  recorded_at: string;
}

export interface MonthlyAggregate {
  id: string;
  streamer_id: string;
  year_month: string;
  total_stars: number;
  broadcast_hours: number;
  prev_month_stars: number;
  diff_stars: number;
  updated_at: string;
}

export interface StreamerWithStats extends Streamer {
  stats?: MonthlyAggregate;
}

export interface CrewStatsSummary {
  crew: Crew;
  members: StreamerWithStats[];
  totalStars: number;
  totalHours: number;
  avgStarsPerMember: number;
}
