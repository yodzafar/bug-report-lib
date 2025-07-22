import { captureScreenshot } from "../utils/capture"
import { createModal } from "../ui/Modal"

export type ProjectName = "EFS" | "TM" | "DONO" | "ANET" | "LEGAL" | "PHYS"

export interface BugReporterOptions {
  project: ProjectName
}

interface BugReportData {
  image: string
  location_url: string
  user_agent: string
  request_url: string
  request_header: Record<string, any>
  request_status_code?: number
  request_payload?: Record<string, any>
  response_data?: Record<string, any>
  project_name: ProjectName
  comment?: string
}

export class BugReporter {
  private project: ProjectName

  constructor(options: BugReporterOptions) {
    this.project = options.project
    this.setupErrorListeners()
  }

  private setupErrorListeners() {
    // Axios
    if (typeof window !== "undefined" && (window as any).axios) {
      ;(window as any).axios.interceptors.response.use(
        (response: any) => response,
        (error: any) => {
          this.storeError({
            request_url: error.config?.url,
            request_payload: error.config?.data,
            request_header: error.config?.headers,
            response_data: error.response?.data,
            request_status_code: error.response?.status,
          })
          return Promise.reject(error)
        }
      )
    }

    // fetch
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          const clone = response.clone()
          const body = await clone.text()
          this.storeError({
            request_url: args[0]?.toString?.(),
            request_header: {},
            response_data: { body },
            request_status_code: response.status,
          })
        }
        return response
      } catch (e) {
        this.storeError({
          request_url: args[0]?.toString?.(),
          request_header: {},
          response_data: { error: e },
        })
        throw e
      }
    }
  }

  private storeError(error: Partial<BugReportData>) {
    const prev = JSON.parse(localStorage.getItem("bug-reporter") || "[]")
    localStorage.setItem(
      "bug-reporter",
      JSON.stringify([
        ...prev,
        {
          ...error,
          location_url: window.location.href,
          user_agent: navigator.userAgent,
          project_name: this.project,
        },
      ])
    )
  }

  public async openModal() {
    const list: BugReportData[] = JSON.parse(
      localStorage.getItem("bug-reporter") || "[]"
    )
    if (!list.length) return alert("No bugs captured")
    const latest = list[list.length - 1]
    const image = await captureScreenshot()
    createModal({ ...latest, image })
  }
}
