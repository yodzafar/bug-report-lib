// index.d.ts
export type ProjectName = 'EFS' | 'TM' | 'DONO' | 'ANET' | 'LEGAL' | 'PHYS'

export interface BugReporterOptions {
  project: ProjectName
}

export interface ReportPayload {
  image: string
  location_url: string
  user_agent: string
  request_url: string
  phone?: string
  request_header: Record<string, unknown>
  request_status_code?: number
  request_payload?: Record<string, unknown>
  response_data?: Record<string, unknown>
  comment?: string
  project_name: ProjectName
}

export declare class BugReporter {
  constructor(options: BugReporterOptions)
  open(): void
}
