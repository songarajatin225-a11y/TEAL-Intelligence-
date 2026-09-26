import { Link, useLocation } from 'react-router-dom';
import { Button, EmptyState } from '../../components/ui';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <EmptyState
      title="Page not found"
      explain={
        <>
          Nothing lives at <code>{pathname}</code>. The link may be from an older version, or the record may exist only as a local draft in another browser.
        </>
      }
      actions={
        <>
          <Link to="/">
            <Button variant="primary">Command Center</Button>
          </Link>
          <Link to={`/search?q=${encodeURIComponent(pathname.split('/').filter(Boolean).pop() ?? '')}`}>
            <Button>Search for it</Button>
          </Link>
        </>
      }
    />
  );
}
