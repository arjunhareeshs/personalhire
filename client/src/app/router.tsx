import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout, AuthLayout, StudentWorkspaceLayout, AdminWorkspaceLayout, BuilderWorkspaceLayout, InterviewRoomLayout } from '../components/layout/Layout'
import LandingPage from '../pages/public/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import WorkspaceHome from '../pages/workspace/WorkspaceHome'
import UploadPage from '../pages/workspace/UploadPage'
import ExtractionProcessingPage from '../pages/workspace/ExtractionProcessingPage'
import ExtractionReviewPage from '../pages/workspace/ExtractionReviewPage'
import AnalysisDashboardPage from '../pages/workspace/AnalysisDashboardPage'
import LinksPage from '../pages/workspace/LinksPage'
import RoadmapPage from '../pages/workspace/RoadmapPage'
import BuilderPage from '../pages/workspace/BuilderPage'
import InterviewLobbyPage from '../pages/workspace/InterviewLobbyPage'
import InterviewRoomPage from '../pages/workspace/InterviewRoomPage'
import InterviewReportPage from '../pages/workspace/InterviewReportPage'
import AdminDashboard from '../pages/admin/AdminDashboard'
import CandidatesPage from '../pages/admin/CandidatesPage'
import CandidateDetailPage from '../pages/admin/CandidateDetailPage'
import BulkUploadPage from '../pages/admin/BulkUploadPage'
import SearchPage from '../pages/admin/SearchPage'
import InterviewsPage from '../pages/admin/InterviewsPage'
import ReportsPage from '../pages/admin/ReportsPage'
import PipelinePage from '../pages/admin/PipelinePage'
import ComparePage from '../pages/admin/ComparePage'
import UsersPage from '../pages/admin/UsersPage'
import MonitoringPage from '../pages/admin/MonitoringPage'
import SettingsPage from '../pages/admin/SettingsPage'

import { useResumeStore } from '../stores/stores'

function SmartDashboardRedirect() {
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)
  if (activeResumeId) {
    return <Navigate to={`/workspace/dashboard/${activeResumeId}`} replace />
  }
  return <Navigate to="/workspace/upload" replace />
}

function SmartBuilderRedirect() {
  const activeResumeId = useResumeStore((s: any) => s.activeResumeId)
  if (activeResumeId) {
    return <Navigate to={`/workspace/builder/${activeResumeId}`} replace />
  }
  return <Navigate to="/workspace/upload" replace />
}

export const router = createBrowserRouter([
  { path: '/', element: <PublicLayout><LandingPage /></PublicLayout> },
  { path: '/login', element: <AuthLayout><LoginPage /></AuthLayout> },
  { path: '/register', element: <AuthLayout><RegisterPage /></AuthLayout> },
  {
    path: '/workspace', element: <StudentWorkspaceLayout><WorkspaceHome /></StudentWorkspaceLayout>,
  },
  { path: '/workspace/upload', element: <StudentWorkspaceLayout><UploadPage /></StudentWorkspaceLayout> },
  { path: '/workspace/extraction/:resumeId/processing', element: <StudentWorkspaceLayout><ExtractionProcessingPage /></StudentWorkspaceLayout> },
  { path: '/workspace/extraction/:resumeId', element: <StudentWorkspaceLayout><ExtractionReviewPage /></StudentWorkspaceLayout> },
  { path: '/workspace/dashboard', element: <SmartDashboardRedirect /> },
  { path: '/workspace/dashboard/:resumeId', element: <StudentWorkspaceLayout><AnalysisDashboardPage /></StudentWorkspaceLayout> },
  { path: '/workspace/links/:resumeId', element: <StudentWorkspaceLayout><LinksPage /></StudentWorkspaceLayout> },
  { path: '/workspace/roadmap/:resumeId', element: <StudentWorkspaceLayout><RoadmapPage /></StudentWorkspaceLayout> },
  { path: '/workspace/builder', element: <SmartBuilderRedirect /> },
  { path: '/workspace/builder/:resumeId', element: <BuilderWorkspaceLayout><BuilderPage /></BuilderWorkspaceLayout> },
  { path: '/workspace/interview', element: <StudentWorkspaceLayout><InterviewLobbyPage /></StudentWorkspaceLayout> },
  { path: '/workspace/interview/:roomName', element: <InterviewRoomLayout><InterviewRoomPage /></InterviewRoomLayout> },
  { path: '/workspace/interview/:roomName/report', element: <StudentWorkspaceLayout><InterviewReportPage /></StudentWorkspaceLayout> },
  { path: '/admin', element: <AdminWorkspaceLayout><AdminDashboard /></AdminWorkspaceLayout> },
  { path: '/admin/candidates', element: <AdminWorkspaceLayout><CandidatesPage /></AdminWorkspaceLayout> },
  { path: '/admin/candidates/:candidateId', element: <AdminWorkspaceLayout><CandidateDetailPage /></AdminWorkspaceLayout> },
  { path: '/admin/bulk-upload', element: <AdminWorkspaceLayout><BulkUploadPage /></AdminWorkspaceLayout> },
  { path: '/admin/search', element: <AdminWorkspaceLayout><SearchPage /></AdminWorkspaceLayout> },
  { path: '/admin/interviews', element: <AdminWorkspaceLayout><InterviewsPage /></AdminWorkspaceLayout> },
  { path: '/admin/reports', element: <AdminWorkspaceLayout><ReportsPage /></AdminWorkspaceLayout> },
  { path: '/admin/pipeline', element: <AdminWorkspaceLayout><PipelinePage /></AdminWorkspaceLayout> },
  { path: '/admin/compare', element: <AdminWorkspaceLayout><ComparePage /></AdminWorkspaceLayout> },
  { path: '/admin/users', element: <AdminWorkspaceLayout><UsersPage /></AdminWorkspaceLayout> },
  { path: '/admin/monitoring', element: <AdminWorkspaceLayout><MonitoringPage /></AdminWorkspaceLayout> },
  { path: '/admin/settings', element: <AdminWorkspaceLayout><SettingsPage /></AdminWorkspaceLayout> },
  { path: '*', element: <Navigate to="/" replace /> },
])

