import CoursePage from './pages/CoursePage'
import CertificatePage from './pages/CertificatePage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const path = window.location.pathname

  const courseMatch = path.match(/^\/c\/([^/]+)\/?$/)
  if (courseMatch) return <CoursePage courseId={courseMatch[1]} />

  const certMatch = path.match(/^\/certificate\/([^/]+)\/?$/)
  if (certMatch) return <CertificatePage certificateId={certMatch[1]} />

  return <NotFoundPage />
}
