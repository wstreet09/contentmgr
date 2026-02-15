export type {
  User,
  Team,
  TeamMembership,
  Project,
  SubAccount,
  ContentBatch,
  ContentItem,
  VideoContent,
  Role,
  ContentType,
  ContentStatus,
  BatchStatus,
} from "@prisma/client"

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ContentRow {
  id: string
  title: string
  contentType: string
  serviceArea: string
  targetAudience: string
  geolocation: string
  targetKeywords: string
  includeCta: boolean
  status: string
}
