import { Link } from "@tanstack/react-router";
import { BadgeCheck, Briefcase, MapPin } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/auth";
import { initials } from "@/lib/format";

export function AlumniCard({
  profile,
  action,
}: {
  profile: Profile;
  action?: React.ReactNode;
}) {
  return (
    <article className="card-surface card-interactive flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar className="size-12">
          <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="truncate font-semibold">{profile.full_name}</h3>
            {profile.status === "verified" ? (
              <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Verified" />
            ) : null}
          </div>
          <p className="truncate text-sm text-muted-foreground">
            {profile.degree} · Class of {profile.grad_year}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        {profile.job_title ? (
          <p className="flex items-center gap-2">
            <Briefcase className="size-3.5 shrink-0" />
            <span className="truncate">
              {profile.job_title}
              {profile.company ? ` at ${profile.company}` : ""}
            </span>
          </p>
        ) : null}
        {profile.location ? (
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{profile.location}</span>
          </p>
        ) : null}
      </div>

      {profile.skills.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 3).map((s) => (
            <Badge key={s} variant="secondary" className="font-normal">
              {s}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/alumni/$id" params={{ id: profile.id }}>
            View profile
          </Link>
        </Button>
        {action}
      </div>
    </article>
  );
}
