"""Link Intelligence API — every platform backed by real fetchers (github.py / platforms.py)."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import ResumeLink
from app.core.links.github import full_profile as gh_full
from app.core.links import platforms as P
from app.core.links.fetchers import username_from_url
router = APIRouter(prefix="/links", tags=["links"])

def _usernames(db: Session, rid: str) -> dict:
    links = db.query(ResumeLink).filter_by(resume_id=rid).all()
    out: dict[str, str] = {}
    for l in links:
        u = username_from_url(l.url)
        if u and l.platform not in out:
            out[l.platform] = u
    return out

@router.post("/{rid}/verify")
async def verify(rid: str, db: Session = Depends(get_db)):
    links = db.query(ResumeLink).filter_by(resume_id=rid).all()
    out: dict = {}
    for l in links:
        u = username_from_url(l.url)
        data = None
        if l.platform == "github" and u:
            data = await gh_full(u)
        elif l.platform == "leetcode" and u:
            data = await P.leetcode_full(u)
        elif l.platform == "codeforces" and u:
            data = await P.codeforces_full(u)
        elif l.platform == "codechef" and u:
            data = await P.codechef_full(u)
        elif l.platform == "hackerrank" and u:
            data = await P.hackerrank_full(u)
        elif l.platform == "kaggle" and u:
            data = await P.kaggle_full(u)
        else:
            # Portfolios, Medium, blogs, live project demos, and other web links
            data = await P.check_professional_link(l.url)
        if data:
            l.verification_status = data.get("status", "unknown")
            l.intelligence_json = data
            out[l.platform] = {"status": data.get("status")}
    from datetime import datetime
    for l in links:
        l.last_checked_at = datetime.utcnow()
    db.commit()
    ok = sum(1 for v in out.values() if v.get("status") in ("verified", "reachable"))
    score = round(100 * ok / max(1, len(out))) if out else 30
    return {"overall_link_score": score, **out}

@router.get("/{rid}")
def get(rid: str, db: Session = Depends(get_db)):
    links = db.query(ResumeLink).filter_by(resume_id=rid).all()
    v = sum(1 for l in links if l.verification_status == "verified")
    b = sum(1 for l in links if l.verification_status == "broken")
    return {"overall_link_score": round(100 * v / max(1, len(links))) if links else 30,
            "links_found": len(links), "verified_links": v, "broken_links": b,
            "links": [{"url": l.url, "platform": l.platform, "status": l.verification_status} for l in links]}

async def _one(rid: str, db: Session, platform: str, fn, demo: str):
    u = _usernames(db, rid).get(platform, demo)
    return await fn(u)

@router.get("/{rid}/github")
async def gh(rid: str, db: Session = Depends(get_db)): return await _one(rid, db, "github", gh_full, "octocat")
@router.get("/{rid}/leetcode")
async def lc(rid: str, db: Session = Depends(get_db)): return await _one(rid, db, "leetcode", P.leetcode_full, "demo")
@router.get("/{rid}/codeforces")
async def cf(rid: str, db: Session = Depends(get_db)): return await _one(rid, db, "codeforces", P.codeforces_full, "tourist")
@router.get("/{rid}/codechef")
async def cc(rid: str, db: Session = Depends(get_db)): return await _one(rid, db, "codechef", P.codechef_full, "demo")
@router.get("/{rid}/hackerrank")
async def hr(rid: str, db: Session = Depends(get_db)): return await _one(rid, db, "hackerrank", P.hackerrank_full, "demo")
@router.get("/{rid}/kaggle")
async def kg(rid: str, db: Session = Depends(get_db)): return await _one(rid, db, "kaggle", P.kaggle_full, "demo")
@router.post("/{rid}/check-link")
async def check(rid: str, d: dict): return await P.check_professional_link(d.get("url", ""))
@router.get("/{rid}/platforms/{platform}")
def plat(rid: str, platform: str): return {"platform": platform, "status": "see dedicated endpoint"}
