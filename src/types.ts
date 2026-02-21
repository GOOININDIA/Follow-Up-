export interface FollowUp {
  id: number;
  customer_name: string;
  phone: string;
  secondary_phone?: string;
  bike?: string;
  purchase_date?: string;
  finance_cash?: string;
  due_amount: number;
  next_follow_up: string;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  phone: string;
  created_at: string;
}

export interface Stats {
  total_due: number;
  total_follow_ups: number;
  due_today: number;
}
