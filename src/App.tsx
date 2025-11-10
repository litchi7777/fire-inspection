import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ProjectList } from '@/components/project/ProjectList';
import { ProjectCreate } from '@/components/project/ProjectCreate';
import { ProjectEdit } from '@/components/project/ProjectEdit';
import { DrawingManagement } from '@/components/drawing/DrawingManagement';
import { DrawingViewer } from '@/components/drawing/DrawingViewer';
import { InspectionEventList } from '@/components/inspection/InspectionEventList';
import { InspectionEventCreate } from '@/components/inspection/InspectionEventCreate';
import { InspectionEventDetail } from '@/components/inspection/InspectionEventDetail';
import { InspectionScreen } from '@/components/inspection/InspectionScreen';
import { useAuthStore } from '@/stores/useAuthStore';

const ProtectedRoute = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <ProjectList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute>
              <ProjectCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/edit"
          element={
            <ProtectedRoute>
              <ProjectEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/drawings"
          element={
            <ProtectedRoute>
              <DrawingManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/drawings/:drawingId"
          element={
            <ProtectedRoute>
              <DrawingViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/events"
          element={
            <ProtectedRoute>
              <InspectionEventList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/events/new"
          element={
            <ProtectedRoute>
              <InspectionEventCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/events/:eventId"
          element={
            <ProtectedRoute>
              <InspectionEventDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/events/:eventId/work"
          element={
            <ProtectedRoute>
              <InspectionScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
