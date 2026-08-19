"""
DocAtt MRSM Kuching - Backend API
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import ipaddress
import logging
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal, Any
import uuid
import random
from datetime import datetime, timezone, timedelta
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ.get('JWT_SECRET', 'docatt-mrsm-kuching-secret-2026')
DEFAULT_ADMIN_CODE = "MK1993"

# Email (Emergent-managed Resend proxy)
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "DocAtt MRSM Kuching")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="DocAtt MRSM Kuching")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --------- Seed data ---------
SEED_TEACHERS = [
    ("Form 1", "Cikgu Alitee", "EG1047"), ("Form 1", "Cikgu Humaidi", "EG2385"),
    ("Form 1", "Cikgu Jamilah", "EG3619"), ("Form 1", "Cikgu Monaliza", "EG4273"),
    ("Form 1", "Cikgu Najiha", "EG5186"), ("Form 1", "Cikgu Norapizah", "EG6420"),
    ("Form 1", "Cikgu Norliza", "EG7531"), ("Form 1", "Cikgu Muhaimin", "EG8642"),
    ("Form 1", "Cikgu Vincent", "EG9754"),
    ("Form 2", "Cikgu Sherry", "EG1168"), ("Form 2", "Cikgu Bariah", "EG2294"),
    ("Form 2", "Cikgu Fakhrul Rifdi", "EG3372"), ("Form 2", "Cikgu Fiona", "EG4458"),
    ("Form 2", "Cikgu Ismas", "EG5591"), ("Form 2", "Cikgu Masmery", "EG6637"),
    ("Form 2", "Cikgu Nurul Aziatul", "EG7749"), ("Form 2", "Cikgu Norhayati", "EG8863"),
    ("Form 2", "Cikgu Azhan", "EG9925"), ("Form 2", "Cikgu Zuliati", "EG2086"),
    ("Form 2", "Cikgu Rozianna", "EG3195"), ("Form 2", "Cikgu Syakirin", "EG4217"),
    ("Form 3", "Cikgu Afiq", "EG5328"), ("Form 3", "Cikgu Amir", "EG6475"),
    ("Form 3", "Cikgu Dayangku", "EG7584"), ("Form 3", "Cikgu Yakub", "EG8691"),
    ("Form 3", "Cikgu Jacqueline", "EG9736"), ("Form 3", "Cikgu Noor Ashikkin", "EG1842"),
    ("Form 3", "Cikgu Nor Azura", "EG2957"), ("Form 3", "Cikgu Saliana", "EG3064"),
    ("Form 3", "Cikgu Sarimah", "EG4179"), ("Form 3", "Cikgu Wan Azmil", "EG5283"),
    ("Form 4", "Cikgu Emiziana", "EG6397"), ("Form 4", "Cikgu Fitri", "EG7416"),
    ("Form 4", "Cikgu Hazliawati", "EG8529"), ("Form 4", "Cikgu Haznizah", "EG9634"),
    ("Form 4", "Cikgu Ivy", "EG1758"), ("Form 4", "Cikgu Nasarudin", "EG2861"),
    ("Form 4", "Cikgu Norani", "EG3975"), ("Form 4", "Cikgu Normala", "EG4082"),
    ("Form 4", "Cikgu Saptuyah", "EG5197"), ("Form 4", "Cikgu Sh. Hasiah", "EG6214"),
    ("Form 4", "Cikgu Sy. Munah", "EG7328"),
    ("Form 5", "Cikgu Aqilah", "EG8435"), ("Form 5", "Cikgu Bethrycia", "EG9541"),
    ("Form 5", "Cikgu Fatmawati", "EG1653"), ("Form 5", "Cikgu Jalil", "EG2769"),
    ("Form 5", "Cikgu Jeissy", "EG3874"), ("Form 5", "Cikgu Melvis", "EG4982"),
    ("Form 5", "Cikgu Nazifa", "EG5096"), ("Form 5", "Cikgu Qasidah", "EG6108"),
    ("Form 5", "Cikgu Roziyah", "EG7215"), ("Form 5", "Cikgu Scholastica", "EG8327"),
    ("Form 5", "Cikgu Sylvia", "EG9436"), ("Form 5", "Cikgu Abang Zainorin", "EG2548"),
]

# --------- Models ---------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def new_id():
    return str(uuid.uuid4())

class Teacher(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    code: str
    form: str  # Form 1..Form 5
    homeroom: str  # "Homeroom Cikgu <name>"

class TeacherIn(BaseModel):
    name: str
    code: str
    form: str
    homeroom: Optional[str] = None

class Student(BaseModel):
    id: str = Field(default_factory=new_id)
    name: str
    matrix_number: str
    homeroom: str
    form: str

class StudentIn(BaseModel):
    name: str
    matrix_number: str
    homeroom: str
    form: str

class Module(BaseModel):
    id: str = Field(default_factory=new_id)
    title: str
    description: str = ""
    image: Optional[str] = None  # base64
    form: str  # Form 1..Form 5 (module is per batch)
    start_at: str  # ISO datetime
    deadline_at: str
    custom_fields: List[dict] = Field(default_factory=list)  # [{label, type}]
    created_at: str = Field(default_factory=now_iso)

class ModuleIn(BaseModel):
    title: str
    description: str = ""
    image: Optional[str] = None
    form: str
    start_at: str
    deadline_at: str
    custom_fields: List[dict] = []

class Report(BaseModel):
    id: str = Field(default_factory=new_id)
    module_id: str
    homeroom: str
    form: str
    submitted_by_id: str
    submitted_by_name: str
    submitted_by_role: str
    meeting_report: str
    date: str
    hr_upload: Optional[str] = None  # base64
    hr_upload_name: Optional[str] = None
    description: str = ""
    attendance_image: Optional[str] = None  # base64
    activity_image: Optional[str] = None  # base64 - for activity/artwork gallery
    activity_caption: str = ""
    custom_values: dict = Field(default_factory=dict)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class ReportIn(BaseModel):
    module_id: str
    meeting_report: str
    date: str
    hr_upload: Optional[str] = None
    hr_upload_name: Optional[str] = None
    description: str = ""
    attendance_image: Optional[str] = None
    activity_image: Optional[str] = None
    activity_caption: str = ""
    custom_values: dict = {}

class ReportUpdate(BaseModel):
    meeting_report: Optional[str] = None
    date: Optional[str] = None
    hr_upload: Optional[str] = None
    hr_upload_name: Optional[str] = None
    description: Optional[str] = None
    attendance_image: Optional[str] = None
    activity_image: Optional[str] = None
    activity_caption: Optional[str] = None
    custom_values: Optional[dict] = None

class COTWEntry(BaseModel):
    rank: int
    homeroom: str
    activity: str = ""

class COTWImage(BaseModel):
    image: str  # base64
    label: str = ""

class COTWConfig(BaseModel):
    leaderboard: List[COTWEntry] = []
    images: List[COTWImage] = []
    updated_at: str = Field(default_factory=now_iso)

class Subject(BaseModel):
    id: str = Field(default_factory=new_id)
    form: str
    name: str
    teacher: str = ""
    link: str = ""
    report_card: str = ""
    test_schedule: str = ""

class SubjectIn(BaseModel):
    form: str
    name: str
    teacher: str = ""
    link: str = ""
    report_card: str = ""
    test_schedule: str = ""

class LoginIn(BaseModel):
    role: Literal["student", "teacher"]
    identifier: str  # matrix_number OR teacher code (or MK1993 for admin)

# --------- Auth helpers ---------
def make_token(payload: dict) -> str:
    return jwt.encode({**payload, "iat": datetime.now(timezone.utc).timestamp()}, JWT_SECRET, algorithm="HS256")

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(401, "Invalid token")

async def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    return decode_token(authorization.split(" ", 1)[1])

async def require_admin(user: dict = Depends(current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user

async def require_editor(user: dict = Depends(current_user)) -> dict:
    """Admin OR teacher can edit shared content (Edustation, etc.)"""
    if user.get("role") not in ("admin", "teacher"):
        raise HTTPException(403, "Admin or teacher only")
    return user

# --------- Seed on startup ---------
@app.on_event("startup")
async def seed():
    # Seed teachers if empty
    count = await db.teachers.count_documents({})
    if count == 0:
        docs = []
        for form, name, code in SEED_TEACHERS:
            t = Teacher(name=name, code=code, form=form, homeroom=f"Homeroom {name}")
            docs.append(t.model_dump())
        if docs:
            await db.teachers.insert_many(docs)
        logger.info(f"Seeded {len(docs)} teachers")
    # Ensure COTW doc exists
    cotw = await db.cotw.find_one({"_id": "singleton"})
    if not cotw:
        await db.cotw.insert_one({"_id": "singleton", **COTWConfig().model_dump()})

# --------- Utility ---------
def strip_id(d):
    if d and "_id" in d:
        d.pop("_id")
    return d

# --------- Auth Routes ---------
@api.post("/auth/login")
async def login(body: LoginIn):
    ident = body.identifier.strip()
    # Admin backdoor — code is dynamic (stored in settings), defaults to MK1993
    settings = await db.settings.find_one({"_id": "singleton"}) or {}
    admin_code = settings.get("admin_code", DEFAULT_ADMIN_CODE)
    if ident == admin_code:
        token = make_token({"user_id": "admin", "role": "admin", "name": "Admin MRSM Kuching"})
        return {"token": token, "user": {"id": "admin", "role": "admin", "name": "Admin MRSM Kuching"}}
    if body.role == "student":
        s = await db.students.find_one({"matrix_number": ident.upper()})
        if not s:
            raise HTTPException(401, "Matrix number not found. Contact admin.")
        strip_id(s)
        token = make_token({"user_id": s["id"], "role": "student", "name": s["name"],
                            "homeroom": s["homeroom"], "form": s["form"]})
        return {"token": token, "user": {**s, "role": "student"}}
    # teacher
    t = await db.teachers.find_one({"code": ident.upper()})
    if not t:
        raise HTTPException(401, "Teacher code not found.")
    strip_id(t)
    token = make_token({"user_id": t["id"], "role": "teacher", "name": t["name"],
                        "homeroom": t["homeroom"], "form": t["form"]})
    return {"token": token, "user": {**t, "role": "teacher"}}

@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return user

# --------- Teachers (admin) ---------
@api.get("/teachers")
async def list_teachers(user: dict = Depends(current_user)):
    items = await db.teachers.find({}, {"_id": 0}).to_list(500)
    return items

@api.post("/teachers")
async def create_teacher(body: TeacherIn, _: dict = Depends(require_admin)):
    hr = body.homeroom or f"Homeroom {body.name}"
    t = Teacher(name=body.name, code=body.code.upper(), form=body.form, homeroom=hr)
    await db.teachers.insert_one(t.model_dump())
    return t.model_dump()

@api.put("/teachers/{tid}")
async def update_teacher(tid: str, body: TeacherIn, _: dict = Depends(require_admin)):
    hr = body.homeroom or f"Homeroom {body.name}"
    upd = {"name": body.name, "code": body.code.upper(), "form": body.form, "homeroom": hr}
    r = await db.teachers.update_one({"id": tid}, {"$set": upd})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/teachers/{tid}")
async def delete_teacher(tid: str, _: dict = Depends(require_admin)):
    await db.teachers.delete_one({"id": tid})
    return {"ok": True}

# --------- Students (admin) ---------
@api.get("/students")
async def list_students(user: dict = Depends(current_user)):
    items = await db.students.find({}, {"_id": 0}).to_list(2000)
    return items

@api.post("/students")
async def create_student(body: StudentIn, _: dict = Depends(require_admin)):
    exists = await db.students.find_one({"matrix_number": body.matrix_number.upper()})
    if exists:
        raise HTTPException(400, "Matrix number exists")
    s = Student(name=body.name, matrix_number=body.matrix_number.upper(),
                homeroom=body.homeroom, form=body.form)
    await db.students.insert_one(s.model_dump())
    return s.model_dump()

@api.put("/students/{sid}")
async def update_student(sid: str, body: StudentIn, _: dict = Depends(require_admin)):
    upd = {"name": body.name, "matrix_number": body.matrix_number.upper(),
           "homeroom": body.homeroom, "form": body.form}
    r = await db.students.update_one({"id": sid}, {"$set": upd})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/students/{sid}")
async def delete_student(sid: str, _: dict = Depends(require_admin)):
    await db.students.delete_one({"id": sid})
    return {"ok": True}

# --------- Modules ---------
@api.get("/modules")
async def list_modules(form: Optional[str] = None, all: Optional[bool] = False,
                       user: dict = Depends(current_user)):
    q = {}
    if all:
        pass  # library view — return everything
    elif form:
        q["form"] = form
    elif user.get("role") in ("student", "teacher"):
        q["form"] = user.get("form")
    items = await db.modules.find(q, {"_id": 0}).sort("start_at", 1).to_list(1000)
    return items

@api.post("/modules")
async def create_module(body: ModuleIn, _: dict = Depends(require_admin)):
    m = Module(**body.model_dump())
    await db.modules.insert_one(m.model_dump())
    return m.model_dump()

@api.put("/modules/{mid}")
async def update_module(mid: str, body: ModuleIn, _: dict = Depends(require_admin)):
    r = await db.modules.update_one({"id": mid}, {"$set": body.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/modules/{mid}")
async def delete_module(mid: str, _: dict = Depends(require_admin)):
    await db.modules.delete_one({"id": mid})
    await db.reports.delete_many({"module_id": mid})
    return {"ok": True}

# --------- Reports ---------
def _module_open(m: dict) -> bool:
    now = datetime.now(timezone.utc)
    try:
        start = datetime.fromisoformat(m["start_at"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(m["deadline_at"].replace("Z", "+00:00"))
    except Exception:
        return True
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)
    return start <= now <= end

@api.get("/reports")
async def list_reports(module_id: Optional[str] = None, homeroom: Optional[str] = None,
                       form: Optional[str] = None, user: dict = Depends(current_user)):
    q = {}
    if module_id:
        q["module_id"] = module_id
    if homeroom:
        q["homeroom"] = homeroom
    if form:
        q["form"] = form
    # Non-admin only sees their homeroom's reports
    if user.get("role") in ("student", "teacher"):
        q["homeroom"] = user.get("homeroom")
    items = await db.reports.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return items

@api.post("/reports")
async def create_report(body: ReportIn, user: dict = Depends(current_user)):
    if user.get("role") == "admin":
        raise HTTPException(400, "Admin submits via user context; use another account")
    m = await db.modules.find_one({"id": body.module_id})
    if not m:
        raise HTTPException(404, "Module not found")
    if m["form"] != user.get("form"):
        raise HTTPException(403, "Module not for your form")
    if not _module_open(m):
        raise HTTPException(400, "Module not open")
    # Only ONE report per homeroom per module
    existing = await db.reports.find_one({"module_id": body.module_id, "homeroom": user["homeroom"]})
    if existing:
        raise HTTPException(400, "Report already submitted for this module in your homeroom")
    r = Report(
        module_id=body.module_id,
        homeroom=user["homeroom"],
        form=user["form"],
        submitted_by_id=user["user_id"],
        submitted_by_name=user["name"],
        submitted_by_role=user["role"],
        meeting_report=body.meeting_report,
        date=body.date,
        hr_upload=body.hr_upload,
        hr_upload_name=body.hr_upload_name,
        description=body.description,
        attendance_image=body.attendance_image,
        activity_image=body.activity_image,
        activity_caption=body.activity_caption or "",
        custom_values=body.custom_values or {},
    )
    await db.reports.insert_one(r.model_dump())
    return r.model_dump()

@api.put("/reports/{rid}")
async def update_report(rid: str, body: ReportUpdate, user: dict = Depends(current_user)):
    r = await db.reports.find_one({"id": rid})
    if not r:
        raise HTTPException(404, "Not found")
    if user.get("role") != "admin" and r["homeroom"] != user.get("homeroom"):
        raise HTTPException(403, "Not your homeroom")
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    upd["updated_at"] = now_iso()
    await db.reports.update_one({"id": rid}, {"$set": upd})
    return {"ok": True}

@api.delete("/reports/{rid}")
async def delete_report(rid: str, user: dict = Depends(current_user)):
    r = await db.reports.find_one({"id": rid})
    if not r:
        raise HTTPException(404, "Not found")
    if user.get("role") != "admin" and r["homeroom"] != user.get("homeroom"):
        raise HTTPException(403, "Not your homeroom")
    await db.reports.delete_one({"id": rid})
    return {"ok": True}

# --------- COTW ---------
@api.get("/cotw")
async def get_cotw(_: dict = Depends(current_user)):
    d = await db.cotw.find_one({"_id": "singleton"})
    if not d:
        return COTWConfig().model_dump()
    d.pop("_id", None)
    return d

@api.put("/cotw")
async def update_cotw(body: COTWConfig, _: dict = Depends(require_admin)):
    body_dict = body.model_dump()
    body_dict["updated_at"] = now_iso()
    await db.cotw.update_one({"_id": "singleton"}, {"$set": body_dict}, upsert=True)
    return {"ok": True}

# --------- Subjects ---------
@api.get("/subjects")
async def list_subjects(form: Optional[str] = None, user: dict = Depends(current_user)):
    q = {}
    if form:
        q["form"] = form
    items = await db.subjects.find(q, {"_id": 0}).to_list(500)
    return items

@api.post("/subjects")
async def create_subject(body: SubjectIn, _: dict = Depends(require_editor)):
    s = Subject(**body.model_dump())
    await db.subjects.insert_one(s.model_dump())
    return s.model_dump()

@api.put("/subjects/{sid}")
async def update_subject(sid: str, body: SubjectIn, _: dict = Depends(require_editor)):
    r = await db.subjects.update_one({"id": sid}, {"$set": body.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/subjects/{sid}")
async def delete_subject(sid: str, _: dict = Depends(require_editor)):
    await db.subjects.delete_one({"id": sid})
    return {"ok": True}

# --------- Stats ---------
@api.get("/stats/pie")
async def stats_pie(module_id: Optional[str] = None, _: dict = Depends(require_admin)):
    """Return submission counts by form (Form 1..Form 5) for a selected module (or all)."""
    q = {}
    if module_id:
        q["module_id"] = module_id
    reports = await db.reports.find(q, {"_id": 0}).to_list(5000)
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    form_to_homerooms = {}
    for t in teachers:
        form_to_homerooms.setdefault(t["form"], set()).add(t["homeroom"])
    result = []
    for form in ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"]:
        submitted = set(r["homeroom"] for r in reports if r["form"] == form)
        total = len(form_to_homerooms.get(form, set()))
        result.append({"form": form, "submitted": len(submitted), "total": total})
    return result

@api.get("/stats/overview")
async def stats_overview(_: dict = Depends(require_admin)):
    return {
        "students": await db.students.count_documents({}),
        "teachers": await db.teachers.count_documents({}),
        "modules": await db.modules.count_documents({}),
        "reports": await db.reports.count_documents({}),
    }

# --------- Homerooms ---------
@api.get("/homerooms")
async def homerooms(user: dict = Depends(current_user)):
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(500)
    return [{"form": t["form"], "homeroom": t["homeroom"], "teacher": t["name"]} for t in teachers]

@api.get("/gallery")
async def gallery(homeroom: Optional[str] = None, form: Optional[str] = None,
                  user: dict = Depends(current_user)):
    q = {"attendance_image": {"$ne": None}}
    if user.get("role") in ("student", "teacher"):
        q["homeroom"] = user["homeroom"]
    else:
        if homeroom:
            q["homeroom"] = homeroom
        if form:
            q["form"] = form
    reports = await db.reports.find(q, {"_id": 0}).sort("created_at", -1).to_list(2000)
    modules = await db.modules.find({}, {"_id": 0, "id": 1, "title": 1}).to_list(2000)
    mmap = {m["id"]: m["title"] for m in modules}
    out = []
    for r in reports:
        if not r.get("attendance_image"):
            continue
        out.append({
            "report_id": r["id"],
            "module_id": r["module_id"],
            "module_title": mmap.get(r["module_id"], "—"),
            "homeroom": r["homeroom"],
            "form": r["form"],
            "image": r["attendance_image"],
            "date": r.get("date"),
            "submitted_by_name": r.get("submitted_by_name"),
            "created_at": r["created_at"],
        })
    return out

@api.get("/reports/{rid}/full")
async def report_full(rid: str, user: dict = Depends(current_user)):
    """Full report + module info for print/PDF view."""
    r = await db.reports.find_one({"id": rid}, {"_id": 0})
    if not r:
        raise HTTPException(404, "Not found")
    if user.get("role") in ("student", "teacher") and r["homeroom"] != user.get("homeroom"):
        raise HTTPException(403, "Not your homeroom")
    m = await db.modules.find_one({"id": r["module_id"]}, {"_id": 0}) or {}
    return {"report": r, "module": m}

@api.get("/")
async def root():
    return {"app": "DocAtt MRSM Kuching", "status": "ok"}

# ============================================================
#                    LANDING PAGE + CMS
# ============================================================

class LandingItem(BaseModel):
    id: str = Field(default_factory=new_id)
    kind: Literal["banner", "news", "stat", "uniqueness"]
    image: Optional[str] = None
    title: str = ""
    description: str = ""
    value: str = ""          # for stat (the big number)
    link: Optional[str] = None  # for news
    order: int = 0
    active: bool = True
    created_at: str = Field(default_factory=now_iso)

class LandingItemIn(BaseModel):
    kind: Literal["banner", "news", "stat", "uniqueness"]
    image: Optional[str] = None
    title: str = ""
    description: str = ""
    value: str = ""
    link: Optional[str] = None
    order: int = 0
    active: bool = True

class LandingSettings(BaseModel):
    news_columns: int = 3  # 3 or 6
    show_keistimewaan: bool = True

@api.get("/public/landing")
async def public_landing():
    items = await db.landing.find({"active": True}, {"_id": 0}).sort("order", 1).to_list(500)
    banners = [i for i in items if i["kind"] == "banner"]
    news = [i for i in items if i["kind"] == "news"]
    stats = [i for i in items if i["kind"] == "stat"]
    uniqueness = [i for i in items if i["kind"] == "uniqueness"]
    settings = await db.settings.find_one({"_id": "singleton"}) or {}
    live_stats = {
        "students": await db.students.count_documents({}),
        "teachers": await db.teachers.count_documents({}),
        "modules": await db.modules.count_documents({}),
        "homerooms": await db.teachers.count_documents({}),
    }
    return {
        "banners": banners,
        "news": news,
        "stats": stats,
        "uniqueness": uniqueness,
        "settings": {
            "news_columns": settings.get("news_columns", 3),
            "show_keistimewaan": settings.get("show_keistimewaan", True),
        },
        "live": live_stats,
    }

@api.get("/public/gallery")
async def public_gallery(category: str = "all"):
    reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    modules_map = {m["id"]: m["title"] async for m in db.modules.find({}, {"_id": 0, "id": 1, "title": 1})}
    out = []
    for r in reports:
        base = {
            "id": r["id"], "homeroom": r["homeroom"], "form": r["form"],
            "module_title": modules_map.get(r["module_id"], "—"),
            "date": r.get("date"), "created_at": r["created_at"],
        }
        if r.get("attendance_image") and category in ("all", "homeroom"):
            out.append({**base, "image": r["attendance_image"], "category": "homeroom"})
        if r.get("activity_image") and category in ("all", "activity"):
            out.append({**base, "image": r["activity_image"], "category": "activity"})
    return out

@api.get("/landing/settings")
async def get_landing_settings(user: dict = Depends(current_user)):
    s = await db.settings.find_one({"_id": "singleton"}) or {}
    return {"news_columns": s.get("news_columns", 3), "show_keistimewaan": s.get("show_keistimewaan", True)}

@api.put("/landing/settings")
async def update_landing_settings(body: LandingSettings, _: dict = Depends(require_admin)):
    await db.settings.update_one({"_id": "singleton"}, {"$set": body.model_dump()}, upsert=True)
    return {"ok": True}

@api.get("/landing")
async def list_landing(user: dict = Depends(current_user)):
    items = await db.landing.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return items

@api.post("/landing")
async def create_landing(body: LandingItemIn, _: dict = Depends(require_admin)):
    item = LandingItem(**body.model_dump())
    await db.landing.insert_one(item.model_dump())
    return item.model_dump()

@api.put("/landing/{lid}")
async def update_landing(lid: str, body: LandingItemIn, _: dict = Depends(require_admin)):
    r = await db.landing.update_one({"id": lid}, {"$set": body.model_dump()})
    if r.matched_count == 0:
        raise HTTPException(404, "Not found")
    return {"ok": True}

@api.delete("/landing/{lid}")
async def delete_landing(lid: str, _: dict = Depends(require_admin)):
    await db.landing.delete_one({"id": lid})
    return {"ok": True}

# ============================================================
#           ADMIN PASSCODE CHANGE (Email verification)
# ============================================================

# Email helpers per Resend playbook
_SHORTENERS = ("bit.ly","tinyurl.com","t.co","is.gd","cutt.ly","goo.gl","rebrand.ly")
_CRED_ASK = ("reply with your password","reply with the code","send your password","cvv",
             "send us your password","enter your password below","confirm your card number",
             "your full card number","seed phrase","recovery phrase","verify your card",
             "social security number","confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)

def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host); return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)

def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)

class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__(); self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []
    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k,v in attrs if k.lower() in ("href","src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(),v) for k,v in attrs).get("href")
            self._text = []
    def handle_data(self, data):
        if self._href is not None: self._text.append(data)
    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []

def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan(); scan.feed(html)
    if scan.tags & {"form","input","textarea","select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:","tel:","cid:","#")): continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real: continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} ≠ real link host {real!r} (G3)")

async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set — skipping actual send")
        return None
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                     headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
        return resp.json().get("id")
    except httpx.HTTPStatusError as e:
        logger.error(f"Email failed: {e.response.status_code} {e.response.text}")
        raise HTTPException(502, "Failed to send email")
    except Exception as e:
        logger.error(f"Email error: {e}")
        raise HTTPException(500, "Failed to send email")

class PasscodeRequestIn(BaseModel):
    email: EmailStr
    new_code: str

class PasscodeVerifyIn(BaseModel):
    email: EmailStr
    code: str

@api.post("/admin/passcode/request-code")
async def passcode_request(body: PasscodeRequestIn, user: dict = Depends(require_admin)):
    """Admin requests to change their passcode. Sends a 6-digit verification code to email."""
    new_code = body.new_code.strip().upper()
    if not new_code or len(new_code) < 4 or len(new_code) > 32:
        raise HTTPException(400, "New passcode must be 4-32 characters")
    code = f"{random.randint(0, 999999):06d}"
    expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    await db.passcode_pending.update_one(
        {"_id": "singleton"},
        {"$set": {"email": str(body.email), "new_code": new_code, "verify_code": code,
                  "expires": expires, "used": False}},
        upsert=True,
    )
    subject = "DocAtt MRSM Kuching · Passcode change verification"
    html = (
        '<table role="presentation" width="100%" style="background:#FBF7F1;padding:24px 0"><tr><td align="center">'
        '<table role="presentation" width="560" style="background:white;border-radius:12px;padding:32px;font-family:Arial,sans-serif">'
        '<tr><td style="border-bottom:3px double #B91C1C;padding-bottom:14px">'
        '<div style="font-size:11px;color:#7f1d1d;letter-spacing:3px;text-transform:uppercase">MRSM Kuching</div>'
        '<div style="font-size:26px;font-weight:800;margin-top:4px">DocAtt Admin</div></td></tr>'
        f'<tr><td style="padding-top:18px;font-size:14px;line-height:22px;color:#111">Salam, kod pengesahan untuk menukar passcode Admin DocAtt:</td></tr>'
        f'<tr><td style="padding-top:18px" align="center"><div style="display:inline-block;background:#FFF8EC;border:2px dashed #B91C1C;padding:16px 30px;border-radius:12px;font-size:34px;letter-spacing:8px;font-weight:800;color:#B91C1C;font-family:Consolas,monospace">{escape(code)}</div></td></tr>'
        '<tr><td style="padding-top:14px;font-size:13px;color:#4B5563">Kod ini sah selama <strong>15 minit</strong>. Jika anda tidak meminta perubahan ini, sila abaikan e-mel ini.</td></tr>'
        f'<tr><td style="padding-top:24px;font-size:11px;color:#9CA3AF;border-top:1px solid #E5E7EB">Sent by {escape(EMAIL_FROM_NAME)}. We never ask you to reply with your password.</td></tr>'
        '</table></td></tr></table>'
    )
    try:
        eid = await send_email(to=str(body.email), subject=subject, html=html)
    except Exception as e:
        logger.error(f"passcode email skipped: {e}")
        eid = None
    logger.info(f"[PASSCODE] verification code for {body.email}: {code}")
    return {"ok": True, "email_id": eid, "dev_code": code if not eid else None}

@api.post("/admin/passcode/verify")
async def passcode_verify(body: PasscodeVerifyIn, user: dict = Depends(require_admin)):
    p = await db.passcode_pending.find_one({"_id": "singleton"})
    if not p or p.get("used"):
        raise HTTPException(400, "No pending passcode change")
    if p["email"] != str(body.email):
        raise HTTPException(400, "Email mismatch")
    if p["verify_code"] != body.code.strip():
        raise HTTPException(400, "Invalid verification code")
    if datetime.fromisoformat(p["expires"]) < datetime.now(timezone.utc):
        raise HTTPException(400, "Code expired — request a new one")
    new_code = p["new_code"]
    await db.settings.update_one({"_id": "singleton"}, {"$set": {"admin_code": new_code}}, upsert=True)
    await db.passcode_pending.update_one({"_id": "singleton"}, {"$set": {"used": True}})
    # Confirmation email
    subject = "DocAtt MRSM Kuching · Passcode changed"
    html = (
        '<table role="presentation" width="100%" style="background:#FBF7F1;padding:24px 0"><tr><td align="center">'
        '<table role="presentation" width="560" style="background:white;border-radius:12px;padding:32px;font-family:Arial,sans-serif">'
        '<tr><td style="border-bottom:3px double #059669;padding-bottom:14px">'
        '<div style="font-size:11px;color:#065f46;letter-spacing:3px;text-transform:uppercase">MRSM Kuching</div>'
        '<div style="font-size:26px;font-weight:800;margin-top:4px;color:#059669">Passcode Aktif</div></td></tr>'
        '<tr><td style="padding-top:18px;font-size:14px;line-height:22px;color:#111">Passcode Admin DocAtt anda telah berjaya dikemas kini. Guna passcode berikut untuk log masuk sebagai Admin:</td></tr>'
        f'<tr><td style="padding-top:18px" align="center"><div style="display:inline-block;background:#F0FDF4;border:2px solid #059669;padding:16px 30px;border-radius:12px;font-size:26px;letter-spacing:6px;font-weight:800;color:#065f46;font-family:Consolas,monospace">{escape(new_code)}</div></td></tr>'
        '<tr><td style="padding-top:14px;font-size:13px;color:#4B5563">Simpan passcode ini di tempat selamat. Jika anda TIDAK membuat perubahan ini, sila hubungi pentadbir sistem serta-merta.</td></tr>'
        f'<tr><td style="padding-top:24px;font-size:11px;color:#9CA3AF;border-top:1px solid #E5E7EB">Sent by {escape(EMAIL_FROM_NAME)}. We never ask you to reply with your password.</td></tr>'
        '</table></td></tr></table>'
    )
    try:
        await send_email(to=str(body.email), subject=subject, html=html)
    except Exception as e:
        logger.error(f"confirmation email skipped: {e}")
    return {"ok": True, "message": "Passcode updated"}

# Report activity image support
class ReportActivityUpdate(BaseModel):
    activity_image: Optional[str] = None
    activity_caption: Optional[str] = None

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
