export type Category = "politics" | "culture" | "education" | "health" | "tech";

export interface Article {
  id: string;
  title: string;
  source: string;
  body: string;
  excerpt: string;
  category: Category;
  created_at: string;
  image_url: string | null;
  author?: string;
  location?: string;
}

export interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  body: string;
  parent_id: string | null;
  created_at: string;
  like_count?: number;
  liked_by_me?: boolean;
  children?: Comment[];
}

export interface Like {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface View {
  id: string;
  article_id: string;
  viewer_hash: string;
  created_at: string;
}

export interface EngagementStats {
  views: number;
  comments: number;
  likes: number;
}

export type ActionKind =
  | "pressure"   // pack a hearing, pressure a vote
  | "birddog"    // contact / corner specific named officials
  | "organize"   // join a coalition, phone bank, build power
  | "testify"    // submit public comment / testimony
  | "petition"   // sign a demand
  | "amplify";   // teach, run a workshop, share the curriculum

export interface Action {
  id: string;
  article_id: string;
  kind: ActionKind;
  title: string;
  description: string;
  url?: string;
  cta_label?: string;
  target?: string; // who's the power holder being pressured
}

export interface CommunityEvent {
  id: string;
  article_id: string;
  title: string;
  description: string;
  starts_at: string;     // ISO
  ends_at?: string;
  location: string;       // human-readable
  is_online: boolean;
  url?: string;
  organizer?: string;
}
