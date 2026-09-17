"""GitHub intelligence — REST profile/repos/events + SVG contributions
calendar (exact heatmap replication). Supports GITHUB_TOKEN for high rate limits,
with HTML fallback if unauthenticated rate limit is reached."""
import os, re, datetime
import httpx

def _headers() -> dict:
    h = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) RViewerAI/1.0",
        "Accept": "application/vnd.github+json"
    }
    tok = os.getenv("GITHUB_TOKEN", "").strip()
    if tok:
        h["Authorization"] = f"Bearer {tok}"
    return h

async def _get(c: httpx.AsyncClient, url: str):
    r = await c.get(url, headers=_headers())
    if r.status_code == 200:
        try:
            return r.json()
        except Exception:
            return None
    elif r.status_code == 403:
        return {"_error": "rate_limited", "_msg": r.text}
    elif r.status_code == 404:
        return {"_error": "not_found"}
    return None

async def contributions_calendar(username: str) -> dict:
    """Parse the public contributions calendar — exact day cells GitHub itself renders."""
    out = {"days": [], "total": 0, "current_streak": 0, "longest_streak": 0}
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as c:
            r = await c.get(f"https://github.com/users/{username}/contributions",
                            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            if r.status_code != 200:
                return out
            
            # Strategy 1: Tooltip-based (Modern GitHub layout)
            # <td id="contribution-day-component-X-Y" ... data-date="YYYY-MM-DD" data-level="L">
            # <tool-tip for="contribution-day-component-X-Y">N contributions on [Date]</tool-tip>
            td_matches = re.findall(r'id="([^"]+)"[^>]*data-date="([\d-]+)"[^>]*data-level="(\d)"', r.text)
            if not td_matches:
                td_matches = re.findall(r'data-date="([\d-]+)"[^>]*id="([^"]+)"[^>]*data-level="(\d)"', r.text)
                td_matches = [(m[1], m[0], m[2]) for m in td_matches]
            
            tooltips = dict(re.findall(r'for="([^"]+)"[^>]*>([^<]+)</tool-tip>', r.text))
            days = []

            if td_matches:
                for comp_id, dt, level in td_matches:
                    tip = tooltips.get(comp_id, "")
                    cnt_m = re.search(r'(\d+)\s+contribution', tip)
                    cnt = int(cnt_m.group(1)) if cnt_m else 0
                    days.append({"date": dt, "count": cnt, "level": int(level)})
            else:
                # Strategy 2: Legacy data-count attribute
                for m in re.findall(r'data-date="([\d-]+)"\s+data-count="(\d+)"\s+data-level="(\d)"', r.text):
                    days.append({"date": m[0], "count": int(m[1]), "level": int(m[2])})

            if days:
                days.sort(key=lambda d: d["date"])
                out["days"] = days
                out["total"] = sum(d["count"] for d in days)
                best = cur = 0
                for d in days:
                    cur = cur + 1 if d["count"] > 0 else 0
                    best = max(best, cur)
                last = datetime.date.fromisoformat(days[-1]["date"])
                gap = (datetime.date.today() - last).days
                out["current_streak"] = cur if gap <= 1 else 0
                out["longest_streak"] = best
    except Exception:
        pass
    return out

async def full_profile(username: str) -> dict:
    base = {"status": "unknown", "username": username, "profile_url": f"https://github.com/{username}"}
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            u = await _get(c, f"https://api.github.com/users/{username}")
            if isinstance(u, dict) and u.get("_error") == "not_found":
                return {**base, "status": "not_found"}
            
            cal = await contributions_calendar(username)
            has_cal = bool(cal["days"])

            # If REST API is rate limited (403), scrape the public profile HTML
            if not u or (isinstance(u, dict) and u.get("_error") == "rate_limited"):
                r_prof = await c.get(f"https://github.com/{username}", headers={"User-Agent": "Mozilla/5.0"})
                if r_prof.status_code == 200:
                    bio_m = re.search(r'<div class="p-note user-profile-bio[^>]*><div>([^<]+)</div>', r_prof.text)
                    avatar_m = re.search(r'<img[^>]*class="avatar[^"]*"[^>]*src="([^"]+)"', r_prof.text)
                    repos_m = re.search(r'<span class="Counter">(\d+)</span>', r_prof.text)
                    return {
                        **base,
                        "status": "verified",
                        "avatar": avatar_m.group(1) if avatar_m else f"https://github.com/{username}.png",
                        "bio": bio_m.group(1).strip() if bio_m else "",
                        "public_repos": int(repos_m.group(1)) if repos_m else 0,
                        "followers": 0, "following": 0,
                        "total_stars": 0, "total_forks": 0, "superstar": False,
                        "recent_commits_90d": 0, "recent_prs_90d": 0, "recent_issues_90d": 0,
                        "languages": [], "top_repositories": [], "all_repo_names": [],
                        "contribution_calendar": cal["days"], "total_contributions": cal["total"],
                        "current_streak": cal["current_streak"], "longest_streak": cal["longest_streak"],
                        "note": "Public view (add GITHUB_TOKEN to .env for detailed repository breakdown)"
                    }
                elif has_cal:
                    return {
                        **base,
                        "status": "verified",
                        "avatar": f"https://github.com/{username}.png",
                        "public_repos": 0, "followers": 0, "following": 0,
                        "total_stars": 0, "total_forks": 0,
                        "contribution_calendar": cal["days"], "total_contributions": cal["total"],
                        "current_streak": cal["current_streak"], "longest_streak": cal["longest_streak"]
                    }
                return {**base, "status": "unknown", "error": "rate_limited"}

            repos = await _get(c, f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated")
            if not isinstance(repos, list):
                repos = []

            events = await _get(c, f"https://api.github.com/users/{username}/events/public?per_page=100")
            if not isinstance(events, list):
                events = []

            commits = sum(len(e.get("payload", {}).get("commits", [])) for e in events if e.get("type") == "PushEvent")
            prs = sum(1 for e in events if e.get("type") == "PullRequestEvent")
            issues = sum(1 for e in events if e.get("type") == "IssuesEvent")
            stars = sum(r.get("stargazers_count", 0) for r in repos)
            forks = sum(r.get("forks_count", 0) for r in repos)

            # Language breakdown: use repos' dominant languages first to conserve rate limits
            lang_counts: dict[str, int] = {}
            for r in repos:
                l = r.get("language")
                if l:
                    lang_counts[l] = lang_counts.get(l, 0) + (r.get("size", 10) or 10)
            total_l = sum(lang_counts.values()) or 1
            languages = [{"lang": k, "bytes": v, "pct": round(100 * v / total_l)}
                         for k, v in sorted(lang_counts.items(), key=lambda x: -x[1])[:8]]

            top = sorted(repos, key=lambda r: -(r.get("stargazers_count", 0)))[:10]
            superb = stars >= 100 or (u.get("followers", 0) >= 100)

            return {
                **base,
                "status": "verified",
                "avatar": u.get("avatar_url") or f"https://github.com/{username}.png",
                "bio": u.get("bio") or "",
                "public_repos": u.get("public_repos", len(repos)),
                "followers": u.get("followers", 0),
                "following": u.get("following", 0),
                "created_at": (u.get("created_at", "") or "")[:10],
                "total_stars": stars,
                "total_forks": forks,
                "superstar": superb,
                "recent_commits_90d": commits,
                "recent_prs_90d": prs,
                "recent_issues_90d": issues,
                "languages": languages,
                "top_repositories": top,
                "all_repo_names": [r.get("name") for r in repos],
                "contribution_calendar": cal["days"],
                "total_contributions": cal["total"],
                "current_streak": cal["current_streak"],
                "longest_streak": cal["longest_streak"]
            }
    except Exception:
        return {**base, "status": "unknown"}
