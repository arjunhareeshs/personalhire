import os, hashlib
from datetime import datetime, timedelta
from jose import jwt
SECRET = os.getenv("JWT_SECRET", "dev-secret")
ALGO = "HS256"
def hash_pw(p: str) -> str: return "sha256$" + hashlib.sha256((p[:72] + SECRET).encode()).hexdigest()
def verify_pw(p: str, h: str) -> bool:
    return h == hash_pw(p) if h.startswith("sha256$") else False
def token(uid: str, role: str) -> str:
    return jwt.encode({"sub": uid, "role": role, "exp": datetime.utcnow() + timedelta(days=7)}, SECRET, algorithm=ALGO)

# ---- role-gated dependencies (§10 rule 1: admin routes role-protected) ----
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.db.database import get_db
_bearer = HTTPBearer()

def get_current_user(creds: HTTPAuthorizationCredentials = Depends(_bearer), db=Depends(get_db)):
    from app.models.models import User
    try:
        payload = jwt.decode(creds.credentials, SECRET, algorithms=[ALGO])
        u = db.query(User).filter_by(id=payload.get("sub")).first()
    except Exception:
        u = None
    if not u or u.status != "active":
        raise HTTPException(401, "unauthorized")
    return u

def require_role(*roles: str):
    def guard(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(403, "forbidden: admin/recruiter only")
        return user
    return guard
