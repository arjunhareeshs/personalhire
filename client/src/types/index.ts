export type Resume = { id: string; filename: string; status: string }
export type Analysis = { overall_score: number; ats_score: number; role_fit_score: number; link_verification_score: number; ai_summary: string; improvement_priorities: string[]; warnings: string[] }
export type BuilderState = { builder_id: string; template_id: string; content: any; style: any }
