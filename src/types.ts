export type ProjectName =
  | "EFS"
  | "TM"
  | "ANET"
  | "LEGAL"
  | "MAIN-SITE"
  | "RISK"
  | "CAREER"

export type Locale = "uz" | "ru" | "en" | "o'z"

export interface BugReporterOptions {
  project: ProjectName
  isJiraCredsRequired?: boolean
}

export type ModalProps = {
  locale?: Locale
  callback?: (status: boolean) => void
}
export type SubmitData = {
  comment?: string
  image: string
  phone?: string
  username?: string
  password?: string
}

export type SubmitHandler = (
  data: Omit<SubmitData, "image">,
  cb?: (status: boolean) => void
) => Promise<void>

interface IBaseReportData {
  location_url: string
}

export interface INetworkReportData extends IBaseReportData {
  request_url: string
  request_header: Record<string, any>
  request_status_code?: number
  request_payload: Record<string, any>
  response_data: Record<string, any>
}

export interface IConsoleErrorData extends IBaseReportData {
  console_error: Record<string, any>
}

export interface IBugReport extends INetworkReportData {
  image: string
  user_agent: string
  project_name: ProjectName
  console_error?: { data: Record<string, any>[] }
  comment?: string
  phone?: string
  username?: string
  password?: string
}
