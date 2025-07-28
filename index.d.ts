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

export declare class BugReporter {
  constructor(options: BugReporterOptions)
  openModal(cb?: (status: boolean) => void): void
}
