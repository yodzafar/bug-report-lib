import { captureScreenshot } from "../utils/capture"
import { createModal } from "../ui/Modal"

export type ProjectName =
  | "EFS"
  | "TM"
  | "ANET"
  | "LEGAL"
  | "MAIN-SITE"
  | "RISK"
  | "CAREER"

export interface BugReporterOptions {
  project: ProjectName
}

export type ModalProps = {
  isClientError?: boolean
  callback?: (status: boolean) => void
}

const CLIENT_ERROR_LOGS = "CLIENT_ERROR_LOGS"
const LAST_ERROR_REQUEST = "LAST_ERROR_REQUEST"

type SubmitData = {
  comment?: string
  image: string
  phone?: string
  clientError?: boolean
}

export type SubmitHandler = (
  { comment, image, phone }: SubmitData,
  cb?: (status: boolean) => void
) => Promise<void>

interface BugReportData {
  image: string
  location_url: string
  user_agent: string
  request_url?: string
  request_header: Record<string, any>
  request_status_code?: number
  request_payload: Record<string, any>
  response_data: Record<string, any>
  project_name: ProjectName
}

const prodUrl = "http://p-c-ers.asakabank.com/report"

export class BugReporter {
  private project: ProjectName

  constructor(options: BugReporterOptions) {
    this.project = options.project
    this.setupErrorListeners()
    this.setupGlobalErrorListeners()
  }

  private setupErrorListeners() {
    // ✅ FETCH hook
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok || !response.status) {
          const cloned = response.clone()
          const body = await cloned.text()

          this.storeError({
            request_url:
              typeof args[0] === "string"
                ? args[0]
                : args[0] instanceof Request
                ? args[0].url
                : args[0] instanceof URL
                ? args[0].toString()
                : undefined,
            request_header: (args[1]?.headers || {}) as any,
            request_status_code: response.status,
            response_data: (() => {
              try {
                const parsed = JSON.parse(body)

                return typeof parsed === "object" && parsed !== null
                  ? parsed
                  : { message: body }
              } catch {
                return { message: body }
              }
            })(),
          })
        }

        return response
      } catch (error: any) {
        this.storeError({
          request_url:
            typeof args[0] === "string"
              ? args[0]
              : args[0] instanceof Request
              ? args[0].url
              : args[0] instanceof URL
              ? args[0].toString()
              : undefined,
          response_data: { message: error?.message || error.toString() },
        })
        throw error
      }
    }

    // ✅ XMLHttpRequest hook (Axios, universal)
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send
    const reporter = this

    XMLHttpRequest.prototype.open = function (method: string, url: string) {
      ;(this as any)._bug_report_url = url
      return originalOpen.apply(this, arguments as any)
    }

    XMLHttpRequest.prototype.send = function (body: any) {
      const xhr = this

      const serializePayload = (payload: any) => {
        if (!payload) return undefined
        if (typeof payload === "string") {
          try {
            return JSON.parse(payload)
          } catch (_) {
            return payload
          }
        } else if (payload instanceof FormData) {
          const obj: Record<string, any> = {}
          for (const [key, value] of payload.entries()) {
            obj[key] = value
          }
          return obj
        } else if (payload instanceof URLSearchParams) {
          const obj: Record<string, any> = {}
          for (const [key, value] of payload.entries()) {
            obj[key] = value
          }
          return obj
        } else if (payload instanceof Blob) {
          return "[Blob]"
        } else if (typeof payload === "object") {
          return payload
        }
        return String(payload)
      }

      const onLoadEnd = () => {
        const status = xhr.status

        if (!(status >= 200 && status < 300)) {
          let responseData: Record<string, any>

          try {
            const parsed = JSON.parse(xhr.responseText)

            // Faqat plain object bo'lsa, o'shani saqlaymiz
            if (
              parsed &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            ) {
              responseData = parsed
            } else {
              // Aks holda objectga o'rab yuboramiz
              responseData = parsed
                ? { message: parsed }
                : { message: "Unknown error" }
            }
          } catch (_) {
            responseData = xhr.responseText
              ? { message: xhr.responseText }
              : { message: "Unknown error" }
          }

          try {
            const headers: Record<string, string> = {}
            const rawHeaders = xhr.getAllResponseHeaders()
            rawHeaders
              .trim()
              .split(/[\r\n]+/)
              .forEach((line) => {
                const parts = line.split(": ")
                const header = parts.shift()
                const value = parts.join(": ")
                if (header) headers[header] = value
              })

            reporter.storeError({
              request_url: (xhr as any)._bug_report_url,
              request_payload: serializePayload(body),
              request_header: headers,
              request_status_code: status,
              response_data: responseData,
            })
          } catch (e) {
            reporter.storeError({
              request_url: (xhr as any)._bug_report_url,
              request_status_code: status,
              response_data: { message: xhr.responseText },
            })
          }
        }

        xhr.removeEventListener("loadend", onLoadEnd)
      }

      xhr.addEventListener("loadend", onLoadEnd)
      return originalSend.call(xhr, body)
    }
  }

  private isHttpError(error: any): boolean {
    const message =
      error?.message ||
      error?.toString?.() ||
      (typeof error === "string" ? error : "")

    const patterns = [
      "Load failed",
      "fetch",
      "Network Error",
      "Request failed",
      "Failed to fetch",
      "status code",
      "timeout",
      "axios",
      "net::ERR",
      "Failed to load resource",
      "A server with the specified hostname could not be found",
      "Failed to fetch",
      "ERR_CONNECTION_REFUSED",
      "ERR_NAME_NOT_RESOLVED",
    ]

    return patterns.some((pattern) => message.includes(pattern))
  }

  private setupGlobalErrorListeners() {
    window.onerror = (message, source, lineno, colno, error) => {
      if (this.isHttpError(error || message)) return

      this.storeClientError({
        response_data: {
          message: error?.message || String(message),
          source,
          line: lineno,
          column: colno,
        },
      })
    }

    window.onunhandledrejection = (event) => {
      const reason = event?.reason
      if (this.isHttpError(reason)) return
      this.storeClientError({
        response_data: {
          message:
            reason?.message || reason?.toString?.() || "Unhandled rejection",
        },
      })
    }
  }

  private storeError(error: Partial<BugReportData>) {
    const newEntry: BugReportData = {
      image: "",
      request_status_code: error.request_status_code,
      request_url: error.request_url,
      location_url: window.location.href,
      user_agent: navigator.userAgent,
      project_name: this.project,
      request_header: error.request_header ?? {},
      request_payload: error.request_payload ?? {},
      response_data: error.response_data ?? {},
    }

    localStorage.setItem(LAST_ERROR_REQUEST, JSON.stringify(newEntry))
  }

  private storeClientError(error: Partial<BugReportData>) {
    let logs: BugReportData = JSON.parse(
      localStorage.getItem(CLIENT_ERROR_LOGS) || "{}"
    )

    if (Object.keys(error).length === 0) {
      console.log(1)
      logs = {
        image: "",
        location_url: window.location.href,
        user_agent: navigator.userAgent,
        project_name: this.project,
        request_url: "",
        request_header: {},
        request_payload: {},
        request_status_code: undefined,
        response_data: error.response_data
          ? {
              client_error: [error.response_data],
            }
          : {},
      }
    } else {
      logs = {
        image: "",
        location_url: window.location.href,
        user_agent: navigator.userAgent,
        project_name: this.project,
        request_url: "",
        request_header: {},
        request_payload: {},
        request_status_code: undefined,
        response_data: {
          client_error: [
            ...(logs.response_data?.client_error || []),
            error.response_data,
          ].slice(-10),
        },
      }
    }

    localStorage.setItem(CLIENT_ERROR_LOGS, JSON.stringify(logs))
  }

  public async openModal({ isClientError, callback }: ModalProps) {
    const image = await captureScreenshot()
    if (isClientError) {
      const lastLogs: BugReportData = JSON.parse(
        localStorage.getItem(CLIENT_ERROR_LOGS) || "{}"
      )
      if (!lastLogs || (lastLogs && Object.keys(lastLogs).length === 0)) {
        return alert("No client errors captured")
      }

      createModal(image, (data) =>
        this.sendReport({ ...data, clientError: true }, callback)
      )
    } else {
      const lastError: BugReportData = JSON.parse(
        localStorage.getItem(LAST_ERROR_REQUEST) || "{}"
      )

      if (!lastError || (lastError && Object.keys(lastError).length === 0))
        return alert("No network errors captured")

      createModal(image, (data) => this.sendReport(data, callback))
    }
  }

  private async sendReport(
    { comment, image, phone, clientError }: SubmitData,
    cb?: (status: boolean) => void
  ) {
    const data = JSON.parse(
      localStorage.getItem(
        clientError ? CLIENT_ERROR_LOGS : LAST_ERROR_REQUEST
      ) || "{}"
    )
    const payload = JSON.stringify({ ...data, image, comment, phone })

    try {
      const res = await fetch(
        `${prodUrl}${clientError ? `/?is_client_error=true` : ""}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        }
      )

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Server returned error response:", responseData)
        if (cb) cb(false)
      } else {
        if (cb) cb(true)
        localStorage.removeItem(LAST_ERROR_REQUEST)
      }
    } catch (e) {
      console.error("Network or other error:", e)
      if (cb) cb(false)
    }
  }
}
