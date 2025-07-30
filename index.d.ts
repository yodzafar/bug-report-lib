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
}

export type ModalProps = {
  isClientError?: boolean
  callback?: (status: boolean) => void
}

export declare class BugReporter {
  constructor(options: BugReporterOptions)
  openModal(props: ModalProps): void
}
