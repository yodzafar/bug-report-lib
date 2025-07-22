// index.d.ts
export type ProjectName =
  | "ANET"
  | "CAREER"
  | "LEGAL"
  | "EFS"
  | "MAIN-SITE"
  | "TM"

export interface BugReporterOptions {
  project: ProjectName
}

export declare class BugReporter {
  constructor(options: BugReporterOptions)
  openModal(): void
}
