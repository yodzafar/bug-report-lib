import { captureScreenshot } from "../utils/capture"
import { createModal } from "../ui/Modal"
import { getTranslations } from "../utils/getTranslation"
import {
  BugReporterOptions,
  IBugReport,
  IConsoleErrorData,
  INetworkReportData,
  Locale,
  ModalProps,
  ProjectName,
  SubmitData,
} from "../types"
import { API_URL, CLIENT_ERROR_LOGS, LAST_ERROR_REQUEST } from "../constants"

export class BugReporter {
  private project: ProjectName
  private isJiraCredsRequired: boolean
  locale?: Locale

  constructor(options: BugReporterOptions) {
    this.project = options.project
    this.isJiraCredsRequired = options.isJiraCredsRequired || false
    this.setupErrorListeners()
    this.setupGlobalErrorListeners()
  }

  private setupErrorListeners() {
    // ✅ Fetch hook
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        if (!response.ok || !response.status) {
          const cloned = response.clone()
          const body = await cloned.text()

          this.storeNetworkError({
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
        this.storeNetworkError({
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

            reporter.storeNetworkError({
              request_url: (xhr as any)._bug_report_url,
              request_payload: serializePayload(body),
              request_header: headers,
              request_status_code: status,
              response_data: responseData,
            })
          } catch (e) {
            reporter.storeNetworkError({
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

      this.storeConsoleError({
        data: {
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
      this.storeConsoleError({
        data: {
          message:
            reason?.message || reason?.toString?.() || "Unhandled rejection",
        },
      })
    }
  }

  private storeNetworkError(error: Partial<INetworkReportData>) {
    const newEntry: INetworkReportData = {
      request_status_code: error.request_status_code,
      request_url: error.request_url || "",
      location_url: window.location.href,
      request_header: error.request_header ?? {},
      request_payload: error.request_payload ?? {},
      response_data: error.response_data ?? {},
    }

    sessionStorage.setItem(LAST_ERROR_REQUEST, JSON.stringify(newEntry))
  }

  private storeConsoleError(error: { data: any }) {
    let logs: IConsoleErrorData[] = JSON.parse(
      sessionStorage.getItem(CLIENT_ERROR_LOGS) || "[]"
    )

    const newEntry: IConsoleErrorData = {
      location_url: window.location.href,
      console_error: error.data,
    }

    sessionStorage.setItem(
      CLIENT_ERROR_LOGS,
      JSON.stringify([...logs, newEntry].slice(-10))
    )
  }

  public async openModal({ callback, locale }: ModalProps) {
    this.locale = locale
    const image = await captureScreenshot()
    createModal(
      image,
      (data) => this.sendReport({ image, ...data }, callback),
      this.locale,
      this.isJiraCredsRequired
    )
  }

  private collectData({
    comment,
    image,
    phone,
    password,
    username,
  }: SubmitData): IBugReport {
    const tmp: IBugReport = {
      project_name: this.project,
      user_agent: navigator.userAgent,
      image: image,
      location_url: window.location.href,
      request_header: {},
      request_payload: {},
      response_data: {},
      request_status_code: 0,
      request_url: "",
      console_error: { data: [] },
      comment,
      phone,
      username,
      password,
    }

    const lastLogs: IConsoleErrorData[] = JSON.parse(
      sessionStorage.getItem(CLIENT_ERROR_LOGS) || "[]"
    )
    const lastError: INetworkReportData = JSON.parse(
      sessionStorage.getItem(LAST_ERROR_REQUEST) || "{}"
    )
    if (lastLogs.length > 0) {
      tmp.console_error = {
        data: lastLogs
          .filter((log) => log.location_url === window.location.href)
          .map((log) => log.console_error)
          .filter((log): log is Record<string, any> => log !== undefined),
      }
    }

    if (lastError.location_url === window.location.href) {
      tmp.request_url = lastError.request_url
      tmp.request_header = lastError.request_header
      tmp.request_status_code = lastError.request_status_code
      tmp.request_payload = lastError.request_payload
      tmp.response_data = lastError.response_data
    }

    return tmp
  }

  private async sendReport(data: SubmitData, cb?: (status: boolean) => void) {
    const t = getTranslations(this.locale)
    const payload = this.collectData(data)

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (!res.ok) {
        console.error("Server returned error response:", responseData)
        if (cb) cb(false)
        else alert(t("report_failed"))
      } else {
        if (cb) cb(true)
        else alert(t("report_success_sent"))
        sessionStorage.removeItem(LAST_ERROR_REQUEST)
      }
    } catch (e) {
      console.error("Network or other error:", e)
      if (cb) cb(false)
      else alert(t("report_failed"))
    }
  }
}
