from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.utils.auth import hash_pw, verify_pw, token
router = APIRouter(prefix="/auth", tags=["auth"])
@router.post("/register")
def register(d: dict, db: Session = Depends(get_db)):
    if db.query(User).filter_by(email=d.get("email")).first(): raise HTTPException(400, "exists")
    u = User(name=d.get("name", ""), email=d["email"], password_hash=hash_pw(d["password"]), role=d.get("role", "student"))
    db.add(u); db.commit(); db.refresh(u)
    return {"user": {"id": u.id, "name": u.name, "email": u.email, "role": u.role}, "access_token": token(u.id, u.role)}
@router.post("/login")
def login(d: dict, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(email=d.get("email")).first()
    if not u or not verify_pw(d.get("password", ""), u.password_hash): raise HTTPException(401, "invalid")
    return {"user": {"id": u.id, "name": u.name, "email": u.email, "role": u.role}, "access_token": token(u.id, u.role)}
@router.get("/me")
def me(db: Session = Depends(get_db)): return {"ok": True}
@router.post("/logout")
def logout(): return {"ok": True}
