import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { Button, ErrorState } from '../components/ui';

/** Route-level error screen: what happened, why, and what to do — never a blank page. */
export function RouteError() {
  const err = useRouteError();
  const why = isRouteErrorResponse(err) ? `${err.status} ${err.statusText}` : err instanceof Error ? err.message : String(err);
  const chunk = /dynamically imported module|Failed to fetch|Loading chunk/i.test(why);
  return (
    <div className="p-4">
      <ErrorState
        what={chunk ? 'This page could not be downloaded.' : 'This page failed while rendering.'}
        why={chunk ? 'A newer version was probably deployed, or you are offline and the page was never cached.' : why}
        todo={chunk ? 'Reload the page. Your local drafts are stored in this browser and are not affected.' : 'Go back or reload. Your local drafts are safe in this browser. If it keeps happening, report the message above.'}
        onRetry={() => window.location.reload()}
      />
      <div className="mt-2 text-center">
        <Link to="/">
          <Button>Command Center</Button>
        </Link>
      </div>
    </div>
  );
}
