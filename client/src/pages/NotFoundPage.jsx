import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="container py-5">
      <EmptyState icon="🧦" title="Page not found" action={<Link to="/" className="btn btn-success">Back to home</Link>}>
        Like a lost sock, this page has gone missing.
      </EmptyState>
    </div>
  );
}
