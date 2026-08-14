// Types du domaine — reflètent le schéma PostgreSQL.
// Aucune référence à un nombre fixe de groupes : tout est dynamique.

export type UserRole = 'ADMIN' | 'TEACHER' | 'GROUP_LEADER' | 'MEMBER' | 'VIEWER'
export type GroupStatus = 'ACTIVE' | 'ARCHIVED'
export type GroupMemberRole = 'LEADER' | 'MEMBER' | 'VIEWER'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_TEST' | 'DONE' | 'VALIDATED'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type ValidationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'VALIDATED' | 'REJECTED' | 'CORRECTION_REQUESTED'
export type DocumentCategory = 'PLAN' | 'REPORT' | 'PHOTO' | 'VIDEO' | 'CALCULATION' | 'TEST' | 'OTHER'
export type DependencyStatus = 'READY' | 'PENDING' | 'BLOCKED'

export interface Profile {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  global_role: UserRole
  created_at: string
}

export interface Group {
  id: string
  name: string
  code: string | null
  theme: string | null
  description: string | null
  leader_id: string | null
  status: GroupStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GroupProgress {
  group_id: string
  name: string
  code: string | null
  status: GroupStatus
  total_tasks: number
  completed_tasks: number
  progress_percent: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role_in_group: GroupMemberRole
  joined_at: string
  profile?: Profile
}

export interface GroupDependency {
  id: string
  from_group_id: string
  to_group_id: string
  status: DependencyStatus
  note: string | null
  created_at: string
}

export interface GroupTask {
  id: string
  group_id: string
  title: string
  description: string | null
  assignee_id: string | null
  status: TaskStatus
  priority: TaskPriority
  start_date: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  author_id: string | null
  content: string
  created_at: string
}

export interface DocumentRow {
  id: string
  group_id: string
  task_id: string | null
  category: DocumentCategory
  storage_path: string
  file_name: string
  description: string | null
  uploaded_by: string | null
  created_at: string
}

export interface Measurement {
  id: string
  group_id: string
  task_id: string | null
  label: string
  theoretical_value: number | null
  measured_value: number | null
  unit: string | null
  operator_id: string | null
  measured_at: string
  comment: string | null
}

export interface TestRow {
  id: string
  group_id: string
  task_id: string | null
  name: string
  objective: string | null
  theoretical_value: number | null
  measured_value: number | null
  unit: string | null
  absolute_error: number | null
  relative_error_pct: number | null
  result: string | null
  operator_id: string | null
  comment: string | null
  performed_at: string
}

export interface ValidationRow {
  id: string
  group_id: string
  task_id: string | null
  status: ValidationStatus
  submitted_by: string | null
  reviewed_by: string | null
  review_comment: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
}

export interface GroupMessage {
  id: string
  group_id: string
  author_id: string | null
  content: string
  client_id: string | null
  created_at: string
}

export interface ProjectDashboardStats {
  active_groups: number
  archived_groups: number
  total_groups: number
  total_memberships: number
  total_participants: number
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  todo_tasks: number
  total_tests: number
  total_documents: number
  pending_validations: number
  global_progress_percent: number
}
