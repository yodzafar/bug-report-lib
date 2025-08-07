// index.d.ts
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
  isJiraCredsRequired?: boolean
}

export type ModalProps = {
  callback?: (status: boolean) => void
  locale?: "uz" | "ru" | "en" | "o'z"
}

export declare class BugReporter {
  constructor(options: BugReporterOptions)
  openModal(props: ModalProps): void
}
