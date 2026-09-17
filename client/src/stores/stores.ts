import { create } from 'zustand'
export const useAuthStore = create<any>((set: any) => ({
  user: null, token: localStorage.getItem('token') || null,
  setAuth: (user: any, token: string) => { localStorage.setItem('token', token); set({ user, token }) },
  logout: () => { localStorage.removeItem('token'); set({ user: null, token: null }) },
}))
export const useResumeStore = create<any>((set: any) => ({
  activeResumeId: localStorage.getItem('resumeId') || null,
  setActive: (id: string) => { localStorage.setItem('resumeId', id); set({ activeResumeId: id }) },
}))
export const useAnalysisStore = create<any>((set: any) => ({
  analysis: null, tab: 'Overview',
  setAnalysis: (a: any) => set({ analysis: a }), setTab: (t: string) => set({ tab: t }),
}))
export const useBuilderStore = create<any>((set: any) => ({
  builderId: null, template: 'modern-pro', step: 0, zoom: 1,
  set: (p: any) => set(p),
}))
export const useInterviewStore = create<any>((set: any) => ({
  room: null, phase: 'introduction', status: 'idle',
  set: (p: any) => set(p),
}))
export const useAdminStore = create<any>((set: any) => ({
  candidates: [], jobs: [],
  set: (p: any) => set(p),
}))
