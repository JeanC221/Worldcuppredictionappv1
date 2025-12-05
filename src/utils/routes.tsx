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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/dashboard',
    element: (
      <Layout>
        <Dashboard />
      </Layout>
    ),
  },
  {
    path: '/prediccion',
    element: (
      <Layout>
        <PredictionForm />
      </Layout>
    ),
  },
  {
    path: '/mi-polla',
    element: (
      <Layout>
        <MyPrediction />
      </Layout>
    ),
  },
  {
    path: '/ranking',
    element: (
      <Layout>
        <Ranking />
      </Layout>
    ),
  },
  {
    path: '/comunidad',
    element: (
      <Layout>
        <Community />
      </Layout>
    ),
  },
  {
    path: '/instrucciones',
    element: (
      <Layout>
        <Instructions />
      </Layout>
    ),
  },
  {
    path: '/admin',
    element: (
      <Layout>
        <AdminPanel />
      </Layout>
    ),
  },
]);
