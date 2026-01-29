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
import PaymentProtectedRoute from '../components/PaymentProtectedRoute';
import CheckoutPage from '../components/checkout/CheckoutPage';
import PaymentSuccess from '../components/checkout/PaymentSuccess';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/checkout',
    element: (
      <ProtectedRoute>
        <Layout>
          <CheckoutPage />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment/success',
    element: (
      <ProtectedRoute>
        <Layout>
          <PaymentSuccess />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/payment/response',
    element: (
      <ProtectedRoute>
        <Layout>
          <PaymentSuccess />
        </Layout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <PaymentProtectedRoute>
        <Layout>
          <Dashboard />
        </Layout>
      </PaymentProtectedRoute>
    ),
  },
  {
    path: '/prediccion',
    element: (
      <PaymentProtectedRoute>
        <Layout>
          <PredictionForm />
        </Layout>
      </PaymentProtectedRoute>
    ),
  },
  {
    path: '/mi-polla',
    element: (
      <PaymentProtectedRoute>
        <Layout>
          <MyPrediction />
        </Layout>
      </PaymentProtectedRoute>
    ),
  },
  {
    path: '/ranking',
    element: (
      <PaymentProtectedRoute>
        <Layout>
          <RequiresPrediction>
            <Ranking />
          </RequiresPrediction>
        </Layout>
      </PaymentProtectedRoute>
    ),
  },
  {
    path: '/comunidad',
    element: (
      <PaymentProtectedRoute>
        <Layout>
          <RequiresPrediction>
            <Community />
          </RequiresPrediction>
        </Layout>
      </PaymentProtectedRoute>
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
