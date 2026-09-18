import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-base font-bold">AlumniConnect</p>
          <p className="mt-2 text-sm text-muted-foreground">
            The alumni network your university actually uses — verified people, real opportunities.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Network</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/alumni" className="hover:text-foreground">
                Alumni directory
              </Link>
            </li>
            <li>
              <Link to="/mentorship" className="hover:text-foreground">
                Find a mentor
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Opportunities</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/jobs" className="hover:text-foreground">
                Job board
              </Link>
            </li>
            <li>
              <Link to="/events" className="hover:text-foreground">
                Events
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-semibold">Support the university</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li>
              <Link to="/giving" className="hover:text-foreground">
                Give today
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AlumniConnect. A demo alumni platform.
      </div>
    </footer>
  );
}
