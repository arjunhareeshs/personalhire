import re
from app.core.links.github import full_profile as fetch_github
from app.core.links.platforms import leetcode_full as fetch_leetcode

def username_from_url(url: str) -> str:
    """Robust username / handle extraction across all developer & professional platforms."""
    u = (url or "").strip().rstrip("/")
    if not u:
        return ""

    # GitHub
    m = re.search(r"github\.com/([^/\s?#]+)", u, re.I)
    if m and m.group(1).lower() not in ("explore", "features", "topics", "collections", "trending", "events"):
        return m.group(1)

    # LeetCode (handles both leetcode.com/username and leetcode.com/u/username)
    m = re.search(r"leetcode\.com/(?:u/)?([^/\s?#]+)", u, re.I)
    if m and m.group(1).lower() not in ("problems", "contest", "explore", "discuss", "interview"):
        return m.group(1)

    # Codeforces
    m = re.search(r"codeforces\.com/(?:profile/)?([^/\s?#]+)", u, re.I)
    if m and m.group(1).lower() not in ("contests", "gym", "problemset", "groups", "ratings"):
        return m.group(1)

    # CodeChef
    m = re.search(r"codechef\.com/(?:users/)?([^/\s?#]+)", u, re.I)
    if m and m.group(1).lower() not in ("contests", "practice", "ratings", "certification"):
        return m.group(1)

    # HackerRank (both hackerrank.com/profile/user and hackerrank.com/user)
    m = re.search(r"hackerrank\.com/(?:profile/)?([^/\s?#]+)", u, re.I)
    if m and m.group(1).lower() not in ("dashboard", "challenges", "leaderboard", "domains", "skills-verification", "contests"):
        return m.group(1)

    # Kaggle
    m = re.search(r"kaggle\.com/(?:u/)?([^/\s?#]+)", u, re.I)
    if m and m.group(1).lower() not in ("datasets", "code", "competitions", "discussions", "learn", "models"):
        return m.group(1)

    # General domain fallback
    for dom in ["linkedin\\.com/in", "gitlab\\.com", "bitbucket\\.org", "medium\\.com/@", "dev\\.to"]:
        m = re.search(dom + r"/([^/\s?#]+)", u, re.I)
        if m:
            return m.group(1).rstrip("/")

    return ""
