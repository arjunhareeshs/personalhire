"""LeetCode intelligence — ONE robust GraphQL request fetching everything (calendar, badges,
languages, topic radar, contest, submissions). Plus Codeforces / CodeChef /
HackerRank / Kaggle / professional-link checkers with real APIs and verified data."""

import re, json
import httpx

UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Accept": "application/json, text/html, */*"
}

LC_QUERY = """
query userProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
      starRating
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    badges {
      id
      displayName
      icon
      creationDate
    }
    upcomingBadges {
      name
      icon
    }
    languageProblemCount {
      languageName
      problemsSolved
    }
    tagProblemCounts {
      advanced {
        tagName
        problemsSolved
      }
      intermediate {
        tagName
        problemsSolved
      }
      fundamental {
        tagName
        problemsSolved
      }
    }
    userCalendar {
      activeYears
      submissionCalendar
      streak
      totalActiveDays
    }
  }
  recentSubmissionList(username: $username, limit: 12) {
    title
    titleSlug
    statusDisplay
    lang
    timestamp
  }
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    topPercentage
    badge {
      name
    }
  }
}
"""

# concept radar mapping: leetcode tags -> radar axes
TAG_AXIS = {
    "Array": "arrays", "String": "strings", "Hash Table": "hashing", "Two Pointers": "two_pointers",
    "Sliding Window": "sliding_window", "Stack": "stack", "Queue": "queue", "Linked List": "linked_list",
    "Tree": "binary_tree", "Binary Tree": "binary_tree", "Binary Search Tree": "binary_search_tree",
    "Binary Search": "binary_search", "Graph": "graphs", "Dynamic Programming": "dynamic_programming",
    "Greedy": "greedy", "Backtracking": "backtracking", "Recursion": "recursion", "Sorting": "sorting",
    "Heap (Priority Queue)": "heap", "Trie": "trie", "Bit Manipulation": "bit_manipulation",
    "Math": "math", "Database": "sql",
}

async def leetcode_full(username: str) -> dict:
    base = {"status": "unknown", "username": username, "profile_url": f"https://leetcode.com/u/{username}/"}
    # 1) Official LeetCode GraphQL, single shot
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post("https://leetcode.com/graphql", headers=UA,
                             json={"query": LC_QUERY, "variables": {"username": username}})
            if r.status_code == 200:
                data = (r.json().get("data") or {})
                mu = data.get("matchedUser")
                if mu:
                    return _lc_from_graphql(base, username, data)
    except Exception:
        pass

    # 2) Fallback: public mirror (parallel fetches)
    try:
        async with httpx.AsyncClient(timeout=12) as c:
            import asyncio as _a
            prof, solv, skill, cal, cont = await _a.gather(
                c.get(f"https://alfa-leetcode-api.onrender.com/{username}"),
                c.get(f"https://alfa-leetcode-api.onrender.com/{username}/solved"),
                c.get(f"https://alfa-leetcode-api.onrender.com/{username}/skillStats"),
                c.get(f"https://alfa-leetcode-api.onrender.com/{username}/calendar"),
                c.get(f"https://alfa-leetcode-api.onrender.com/{username}/contest"),
                return_exceptions=True)
            def J(x, d=None):
                try:
                    j = x.json()
                    return j if isinstance(j, (dict, list)) else d
                except Exception:
                    return d
            pj, sj, kj, cj, tj = J(prof, {}), J(solv, {}), J(skill, {}), J(cal, {}), J(cont, {})
            pj, sj, kj = (x if isinstance(x, dict) else {} for x in (pj, sj, kj))
            tj = tj if isinstance(tj, dict) else {}
            if not pj and not sj:
                return base
            mu = ((pj.get("data") or {}).get("matchedUser") or pj) if isinstance(pj, dict) else {}
            tagc = ((kj.get("data") or {}).get("matchedUser", {}).get("tagProblemCounts")
                    or (kj.get("data") or {}).get("tagProblemCounts") or kj.get("tagProblemCounts", {}))
            radar: dict[str, int] = {}
            for grp in (tagc.values() if isinstance(tagc, dict) else []):
                for t in grp or []:
                    ax = TAG_AXIS.get(t.get("tagName", ""), (t.get("tagName", "") or "").lower().replace(" ", "_"))
                    radar[ax] = min(100, radar.get(ax, 0) + min(100, (t.get("problemsSolved", 0)) * 4))
            subcal_raw = (cj.get("submissionCalendar") if isinstance(cj, dict) else None) or (cj if isinstance(cj, dict) else {})
            if isinstance(subcal_raw, str):
                try:
                    subcal_raw = json.loads(subcal_raw)
                except Exception:
                    subcal_raw = {}
            heat = [{"ts": int(k), "count": v} for k, v in (subcal_raw.items() if isinstance(subcal_raw, dict) else []) if str(k).isdigit()]
            lang_src = mu.get("languageProblemCount") or []
            easy, med, hard = (sj.get("easySolved", 0), sj.get("mediumSolved", 0), sj.get("hardSolved", 0))
            total = sj.get("solvedProblem", easy + med + hard)
            return {**base, "status": "verified" if total else "unavailable",
                    "total_solved": total, "easy_solved": easy, "medium_solved": med, "hard_solved": hard,
                    "acceptance_rate": None, "ranking": mu.get("ranking") or pj.get("ranking"),
                    "reputation": mu.get("reputation", 0), "badges": [], "upcoming_badges": [],
                    "language_counts": [{"lang": l.get("languageName"), "count": l.get("problemsSolved")} for l in lang_src], "concept_radar": radar,
                    "submission_heatmap": heat, "streak": 0,
                    "active_days": len(heat), "recent_submissions": [],
                    "contest": {"rating": (tj.get("contestRating")), "global_rank": tj.get("contestGlobalRanking"),
                                "attended": tj.get("contestAttend", 0), "top_pct": tj.get("contestTopPercentage"),
                                "badge": (tj.get("contestBadges") or {}).get("name") if isinstance(tj.get("contestBadges"), dict) else None}}
    except Exception:
        pass
    return base

def _lc_from_graphql(base: dict, username: str, data: dict) -> dict:
    mu = data.get("matchedUser") or {}
    ac = {x["difficulty"]: x for x in ((mu.get("submitStatsGlobal") or {}).get("acSubmissionNum") or [])}
    total = (ac.get("All") or {}).get("count", 0)
    radar: dict[str, int] = {}
    for grp in ((mu.get("tagProblemCounts") or {}).values() or []):
        for t in grp or []:
            ax = TAG_AXIS.get(t.get("tagName", ""), t.get("tagName", "").lower().replace(" ", "_"))
            radar[ax] = min(100, radar.get(ax, 0) + min(100, (t.get("problemsSolved", 0)) * 4))
    cal = mu.get("userCalendar") or {}
    try:
        subcal = json.loads(cal.get("submissionCalendar") or "{}")
    except Exception:
        subcal = {}
    heat = [{"ts": int(k), "count": v} for k, v in subcal.items()]
    contest = data.get("userContestRanking") or {}
    langs = sorted(mu.get("languageProblemCount") or [], key=lambda x: -x.get("problemsSolved", 0))
    easy, med, hard = (ac.get("Easy") or {}).get("count", 0), (ac.get("Medium") or {}).get("count", 0), (ac.get("Hard") or {}).get("count", 0)
    badges = [{"name": b.get("displayName") or b.get("name", "Badge"), "icon": b.get("icon")} for b in (mu.get("badges") or [])]
    return {
        **base,
        "status": "verified" if (total or contest.get("rating")) else "unavailable",
        "total_solved": total,
        "easy_solved": easy, "medium_solved": med, "hard_solved": hard,
        "acceptance_rate": round(100 * total / max(1, (ac.get("All") or {}).get("submissions", 0)), 1),
        "ranking": (mu.get("profile") or {}).get("ranking"),
        "reputation": (mu.get("profile") or {}).get("reputation", 0),
        "badges": badges,
        "upcoming_badges": [b.get("name") for b in (mu.get("upcomingBadges") or []) if isinstance(b, dict)],
        "language_counts": [{"lang": l.get("languageName"), "count": l.get("problemsSolved")} for l in langs],
        "concept_radar": radar,
        "submission_heatmap": heat,
        "streak": cal.get("streak", 0),
        "active_days": cal.get("totalActiveDays") or len(heat),
        "recent_submissions": data.get("recentSubmissionList") or [],
        "contest": {
            "rating": contest.get("rating"),
            "global_rank": contest.get("globalRanking"),
            "attended": contest.get("attendedContestsCount", 0),
            "top_pct": contest.get("topPercentage"),
            "badge": (contest.get("badge") or {}).get("name") if isinstance(contest.get("badge"), dict) else None
        }
    }

async def codeforces_full(handle: str) -> dict:
    base = {"status": "unknown", "handle": handle, "profile_url": f"https://codeforces.com/profile/{handle}"}
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            info = (await c.get("https://codeforces.com/api/user.info", params={"handles": handle})).json()
            if info.get("status") != "OK":
                return {**base, "status": "not_found"}
            u = info["result"][0]
            subs = (await c.get("https://codeforces.com/api/user.status", params={"handle": handle, "from": 1, "count": 400})).json().get("result", [])
            ok = [s for s in subs if s.get("verdict") == "OK"]
            langs: dict[str, int] = {}
            tags: dict[str, int] = {}
            for s in ok:
                langs[s.get("programmingLanguage", "Other")] = langs.get(s.get("programmingLanguage", "Other"), 0) + 1
                for t in (s.get("problem", {}) or {}).get("tags", []):
                    tags[t] = tags.get(t, 0) + 1
            hist = (await c.get("https://codeforces.com/api/user.rating", params={"handle": handle})).json().get("result", [])
            curve = [{"contest": h.get("contestName", "")[:40], "rating": h.get("newRating"), "rank": h.get("rank")} for h in hist]
            return {
                **base,
                "status": "verified",
                "rating": u.get("rating"),
                "max_rating": u.get("maxRating"),
                "rank": u.get("rank"),
                "max_rank": u.get("maxRank"),
                "contribution": u.get("contribution", 0),
                "friends": u.get("friendOfCount", 0),
                "solved": len({((s.get("problem", {}) or {}).get("contestId"), (s.get("problem", {}) or {}).get("index")) for s in ok}),
                "attempted": len(subs),
                "languages": sorted(langs.items(), key=lambda x: -x[1])[:8],
                "topic_coverage": sorted(tags.items(), key=lambda x: -x[1])[:16],
                "rating_history": curve
            }
    except Exception:
        return base

async def codechef_full(username: str) -> dict:
    base = {"status": "unknown", "username": username, "profile_url": f"https://www.codechef.com/users/{username}"}
    try:
        async with httpx.AsyncClient(timeout=14, follow_redirects=True) as c:
            r = await c.get(f"https://www.codechef.com/users/{username}", headers=UA)
            if r.status_code != 200:
                return base
            
            # Extract current rating from embedded all_rating JSON in Drupal.settings
            current_rating = None
            stars = None
            m_ratings = re.search(r'"all_rating":\s*(\[[^\]]+\])', r.text)
            if m_ratings:
                try:
                    contests = json.loads(m_ratings.group(1))
                    if contests:
                        latest = contests[-1]
                        r_val = latest.get("rating") or latest.get("elo_rating")
                        if r_val and str(r_val).isdigit():
                            current_rating = int(r_val)
                except Exception:
                    pass
            
            # Fallback rating regex
            if not current_rating:
                div_m = re.search(r'class="rating-number">(\d+)', r.text) or re.search(r'"rating":\s*"?(\d+)"?', r.text)
                if div_m:
                    current_rating = int(div_m.group(1))

            # Extract star rating
            star_m = re.search(r'(\d+)\s*★', r.text) or re.search(r'class="rating-star">([^<]+)', r.text)
            if star_m:
                stars = star_m.group(1).strip()

            title_m = re.search(r"<title>(.*?)</title>", r.text, re.S | re.I)
            title = title_m.group(1).strip()[:120] if title_m else ""

            return {
                **base,
                "status": "verified" if current_rating else "reachable",
                "profile_url": str(r.url),
                "rating": current_rating,
                "stars": stars,
                "page_title": title
            }
    except Exception:
        return base

async def hackerrank_full(username: str) -> dict:
    base = {"status": "unknown", "username": username, "profile_url": f"https://www.hackerrank.com/profile/{username}"}
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as c:
            # HackerRank public REST API endpoints
            r_badges = await c.get(f"https://www.hackerrank.com/rest/hackers/{username}/badges", headers=UA)
            r_scores = await c.get(f"https://www.hackerrank.com/rest/hackers/{username}/scores_elo", headers=UA)

            badges_list = []
            skills_list = []

            if r_badges.status_code == 200:
                data = r_badges.json()
                for b in data.get("models", []):
                    bname = b.get("badge_name") or b.get("name")
                    stars = b.get("stars", 0)
                    if bname:
                        badges_list.append(f"{bname} ({stars}★)" if stars else bname)
            
            if r_scores.status_code == 200:
                scores_data = r_scores.json()
                if isinstance(scores_data, list):
                    for track in scores_data:
                        tname = track.get("name")
                        if tname:
                            skills_list.append(tname)

            if badges_list or skills_list:
                return {
                    **base,
                    "status": "verified",
                    "badges": badges_list,
                    "skills": skills_list
                }
            
            # Check profile reachability
            r_prof = await c.get(f"https://www.hackerrank.com/profile/{username}", headers=UA)
            if r_prof.status_code == 200:
                return {**base, "status": "verified", "badges": [], "skills": []}
    except Exception:
        pass
    return base

async def kaggle_full(username: str) -> dict:
    base = {"status": "unknown", "username": username, "profile_url": f"https://www.kaggle.com/{username}"}
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=True) as c:
            r = await c.get(f"https://www.kaggle.com/{username}", headers=UA)
            if r.status_code == 200:
                title_m = re.search(r"<title>(.*?)</title>", r.text, re.S | re.I)
                title = title_m.group(1).strip()[:120] if title_m else ""
                tiers = re.findall(r'(Grandmaster|Master|Expert|Contributor|Novice)', r.text)
                return {
                    **base,
                    "status": "verified",
                    "page_title": title,
                    "tiers_seen": sorted(set(tiers))
                }
            elif r.status_code == 404:
                return {**base, "status": "not_found"}
    except Exception:
        pass
    return base

async def check_professional_link(url: str) -> dict:
    """LinkedIn / portfolio / post reachability + title. LinkedIn blocks bots → 'private'."""
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            r = await c.get(url, headers=UA)
            if r.status_code in (401, 403, 999):
                return {"url": url, "status": "private", "note": "Login-walled or bot-protected (LinkedIn/Medium). Public verification recorded."}
            if r.status_code >= 400:
                return {"url": url, "status": "broken", "code": r.status_code}
            title = (re.search(r"<title>(.*?)</title>", r.text, re.S | re.I) or [None, ""])[1].strip()[:140]
            return {"url": url, "status": "verified" if r.status_code == 200 else "reachable", "title": title}
    except Exception as e:
        return {"url": url, "status": "unknown", "note": str(e)[:120]}
