import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Login } from '../components/Login';
import { Dashboard } from '../components/Dashboard';
import { PredictionForm } from '../components/PredictionForm';
import { MyPrediction } from '../components/MyPrediction';
import { Ranking } from '../components/Ranking';
import { Community } from '../components/Community';
import { Instructions } from '../components/Instructions';
import { AdminPanel } from '../components/AdminPanel';
import { Profile } from '../components/Profile';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RequiresPrediction } from '../components/RequiresPrediction';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/prediccion',
    element: (
      <ProtectedRoute>
        <Layout>
          <PredictionForm />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/mi-polla',
    element: (
      <ProtectedRoute>
        <Layout>
          <MyPrediction />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ranking',
    element: (
      <ProtectedRoute>
        <Layout>
          <RequiresPrediction>
            <Ranking />
          </RequiresPrediction>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/comunidad',
    element: (
      <ProtectedRoute>
        <Layout>
          <RequiresPrediction>
            <Community />
          </RequiresPrediction>
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/instrucciones',
    element: (
      <ProtectedRoute>
        <Layout>
          <Instructions />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Layout>
          <AdminPanel />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/perfil',
    element: (
      <ProtectedRoute>
        <Layout>
          <Profile />
        </Layout>
      </ProtectedRoute>
    ),
  },
]);
