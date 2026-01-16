from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, status, Header
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import bcrypt
import jwt
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
PRODUCTS_UPLOAD_DIR = UPLOAD_DIR / "products"
VIDEOS_UPLOAD_DIR = UPLOAD_DIR / "videos"
PRODUCTS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
VIDEOS_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'shraddha-enterprises-secret-key-2024')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Shraddha Enterprises API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class Category(CategoryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SubcategoryBase(BaseModel):
    name: str
    category_id: str
    description: Optional[str] = None

class Subcategory(SubcategoryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductBase(BaseModel):
    name: str
    category_id: str
    subcategory_id: Optional[str] = None
    description: str
    images: List[str] = []  # List of relative paths
    is_featured: bool = False

class Product(ProductBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductResponse(BaseModel):
    id: str
    name: str
    category_id: str
    subcategory_id: Optional[str] = None
    description: str
    images: List[str] = []
    is_featured: bool = False
    category_name: Optional[str] = None
    subcategory_name: Optional[str] = None
    created_at: str
    updated_at: str

class VideoBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    display_order: int = 0

class Video(VideoBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    file_path: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QueryBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    product_name: str
    product_id: Optional[str] = None
    message: Optional[str] = None

class Query(QueryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "pending"

class AdminBase(BaseModel):
    email: EmailStr
    name: str

class Admin(AdminBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: dict

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_token(admin_id: str, email: str) -> str:
    payload = {
        'sub': admin_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_admin(token: str = None) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        admin = await db.admins.find_one({"id": payload['sub']}, {"_id": 0, "password_hash": 0})
        if not admin:
            raise HTTPException(status_code=401, detail="Admin not found")
        return admin
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== EMAIL SERVICE ====================

async def send_admin_notification(query_data: dict):
    """Send email notification to admin about new query"""
    gmail_user = os.environ.get('GMAIL_USER')
    gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
    admin_email = os.environ.get('ADMIN_EMAIL', gmail_user)
    
    if not gmail_user or not gmail_password:
        logger.warning("Gmail credentials not configured, skipping email")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "There is a query from the customer"
        msg['From'] = gmail_user
        msg['To'] = admin_email
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #0F172A;">New Customer Query</h2>
            <div style="background: #F1F5F9; padding: 20px; border-radius: 8px;">
                <p><strong>Customer Name:</strong> {query_data['name']}</p>
                <p><strong>Email:</strong> {query_data['email']}</p>
                <p><strong>Phone:</strong> {query_data['phone']}</p>
                <p><strong>Product:</strong> {query_data['product_name']}</p>
                {f"<p><strong>Message:</strong> {query_data.get('message', '')}</p>" if query_data.get('message') else ""}
            </div>
            <p style="color: #64748B; margin-top: 20px;">
                This is an automated notification from Shraddha Enterprises website.
            </p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, admin_email, msg.as_string())
        
        return True
    except Exception as e:
        logger.error(f"Failed to send admin notification: {e}")
        return False

async def send_customer_acknowledgement(customer_email: str, customer_name: str):
    """Send acknowledgement email to customer"""
    gmail_user = os.environ.get('GMAIL_USER')
    gmail_password = os.environ.get('GMAIL_APP_PASSWORD')
    
    if not gmail_user or not gmail_password:
        logger.warning("Gmail credentials not configured, skipping email")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Thank you for your inquiry - Shraddha Enterprises"
        msg['From'] = gmail_user
        msg['To'] = customer_email
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #0F172A;">Shraddha Enterprises</h1>
            </div>
            <p>Dear {customer_name},</p>
            <p>We got your request and will get back to you shortly.</p>
            <p style="margin-top: 30px;">
                Regards,<br/>
                <strong>Shraddha Enterprises</strong>
            </p>
            <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;"/>
            <p style="color: #64748B; font-size: 12px;">
                Indradhanu, Sector No. 21, Scheme No. 4, Plot No. 78<br/>
                Yamunanagar, Nigdi, Pune – 411044<br/>
                Maharashtra, India
            </p>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, customer_email, msg.as_string())
        
        return True
    except Exception as e:
        logger.error(f"Failed to send customer acknowledgement: {e}")
        return False

# ==================== ROUTES ====================

# Root
@api_router.get("/")
async def root():
    return {"message": "Shraddha Enterprises API", "status": "running"}

# Health check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register_admin(data: AdminRegister):
    # Check if admin exists
    existing = await db.admins.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this email already exists")
    
    admin = Admin(
        email=data.email,
        name=data.name,
        password_hash=hash_password(data.password)
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    
    token = create_token(admin.id, admin.email)
    return TokenResponse(
        access_token=token,
        admin={"id": admin.id, "email": admin.email, "name": admin.name}
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login_admin(data: AdminLogin):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin or not verify_password(data.password, admin['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(admin['id'], admin['email'])
    return TokenResponse(
        access_token=token,
        admin={"id": admin['id'], "email": admin['email'], "name": admin['name']}
    )

@api_router.get("/auth/me")
async def get_current_admin_info(authorization: str = Header(None)):
    admin = await get_current_admin(authorization)
    return admin

# ==================== CATEGORY ROUTES ====================

@api_router.get("/categories", response_model=List[dict])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=dict)
async def create_category(data: CategoryBase, authorization: str = Header(None)):
    await get_current_admin(authorization)
    
    category = Category(**data.model_dump())
    doc = category.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.categories.insert_one(doc)
    
    return {"id": category.id, "name": category.name, "description": category.description, "created_at": doc['created_at']}

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, authorization: str = Header(None)):
    await get_current_admin(authorization)
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    # Also delete subcategories
    await db.subcategories.delete_many({"category_id": category_id})
    return {"message": "Category deleted"}

# ==================== SUBCATEGORY ROUTES ====================

@api_router.get("/subcategories", response_model=List[dict])
async def get_subcategories(category_id: Optional[str] = None):
    query = {"category_id": category_id} if category_id else {}
    subcategories = await db.subcategories.find(query, {"_id": 0}).to_list(100)
    return subcategories

@api_router.post("/subcategories", response_model=dict)
async def create_subcategory(data: SubcategoryBase, authorization: str = Header(None)):
    await get_current_admin(authorization)
    
    # Verify category exists
    category = await db.categories.find_one({"id": data.category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    subcategory = Subcategory(**data.model_dump())
    doc = subcategory.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.subcategories.insert_one(doc)
    
    return {"id": subcategory.id, "name": subcategory.name, "category_id": subcategory.category_id, "description": subcategory.description, "created_at": doc['created_at']}

@api_router.delete("/subcategories/{subcategory_id}")
async def delete_subcategory(subcategory_id: str, authorization: str = Header(None)):
    await get_current_admin(authorization)
    result = await db.subcategories.delete_one({"id": subcategory_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return {"message": "Subcategory deleted"}

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(category_id: Optional[str] = None, subcategory_id: Optional[str] = None, featured: Optional[bool] = None):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if subcategory_id:
        query["subcategory_id"] = subcategory_id
    if featured is not None:
        query["is_featured"] = featured
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    
    # Get categories and subcategories for names
    categories = {c['id']: c['name'] for c in await db.categories.find({}, {"_id": 0}).to_list(100)}
    subcategories = {s['id']: s['name'] for s in await db.subcategories.find({}, {"_id": 0}).to_list(100)}
    
    result = []
    for p in products:
        result.append(ProductResponse(
            id=p['id'],
            name=p['name'],
            category_id=p['category_id'],
            subcategory_id=p.get('subcategory_id'),
            description=p['description'],
            images=p.get('images', []),
            is_featured=p.get('is_featured', False),
            category_name=categories.get(p['category_id']),
            subcategory_name=subcategories.get(p.get('subcategory_id')) if p.get('subcategory_id') else None,
            created_at=p['created_at'] if isinstance(p['created_at'], str) else p['created_at'].isoformat(),
            updated_at=p['updated_at'] if isinstance(p['updated_at'], str) else p['updated_at'].isoformat()
        ))
    
    return result

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Get category and subcategory names
    category = await db.categories.find_one({"id": product['category_id']}, {"_id": 0})
    subcategory = None
    if product.get('subcategory_id'):
        subcategory = await db.subcategories.find_one({"id": product['subcategory_id']}, {"_id": 0})
    
    return ProductResponse(
        id=product['id'],
        name=product['name'],
        category_id=product['category_id'],
        subcategory_id=product.get('subcategory_id'),
        description=product['description'],
        images=product.get('images', []),
        is_featured=product.get('is_featured', False),
        category_name=category['name'] if category else None,
        subcategory_name=subcategory['name'] if subcategory else None,
        created_at=product['created_at'] if isinstance(product['created_at'], str) else product['created_at'].isoformat(),
        updated_at=product['updated_at'] if isinstance(product['updated_at'], str) else product['updated_at'].isoformat()
    )

@api_router.post("/products", response_model=dict)
async def create_product(
    name: str = Form(...),
    category_id: str = Form(...),
    description: str = Form(...),
    subcategory_id: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    images: List[UploadFile] = File(default=[]),
    authorization: str = Header(None)
):
    await get_current_admin(authorization)
    
    # Verify category exists
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    product_id = str(uuid.uuid4())
    image_paths = []
    
    # Save uploaded images
    for i, image in enumerate(images):
        if image.filename:
            ext = Path(image.filename).suffix
            filename = f"{product_id}_{i}{ext}"
            filepath = PRODUCTS_UPLOAD_DIR / filename
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            image_paths.append(f"/uploads/products/{filename}")
    
    now = datetime.now(timezone.utc)
    product_doc = {
        "id": product_id,
        "name": name,
        "category_id": category_id,
        "subcategory_id": subcategory_id if subcategory_id else None,
        "description": description,
        "images": image_paths,
        "is_featured": is_featured,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.products.insert_one(product_doc)
    
    return {"id": product_id, "message": "Product created successfully"}

@api_router.put("/products/{product_id}", response_model=dict)
async def update_product(
    product_id: str,
    name: str = Form(...),
    category_id: str = Form(...),
    description: str = Form(...),
    subcategory_id: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    existing_images: str = Form("[]"),  # JSON string of existing image paths to keep
    images: List[UploadFile] = File(default=[]),
    authorization: str = Header(None)
):
    await get_current_admin(authorization)
    
    import json
    
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Parse existing images to keep
    try:
        keep_images = json.loads(existing_images)
    except:
        keep_images = []
    
    # Save new uploaded images
    new_image_paths = []
    for i, image in enumerate(images):
        if image.filename:
            ext = Path(image.filename).suffix
            filename = f"{product_id}_{datetime.now().timestamp()}_{i}{ext}"
            filepath = PRODUCTS_UPLOAD_DIR / filename
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            new_image_paths.append(f"/uploads/products/{filename}")
    
    all_images = keep_images + new_image_paths
    
    update_doc = {
        "name": name,
        "category_id": category_id,
        "subcategory_id": subcategory_id if subcategory_id else None,
        "description": description,
        "images": all_images,
        "is_featured": is_featured,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.update_one({"id": product_id}, {"$set": update_doc})
    
    return {"id": product_id, "message": "Product updated successfully"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, authorization: str = Header(None)):
    await get_current_admin(authorization)
    
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete associated images
    for image_path in product.get('images', []):
        filepath = ROOT_DIR / image_path.lstrip('/')
        if filepath.exists():
            filepath.unlink()
    
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}

# ==================== VIDEO ROUTES ====================

@api_router.get("/videos", response_model=List[dict])
async def get_videos(category: Optional[str] = None):
    query = {"category": category} if category else {}
    videos = await db.videos.find(query, {"_id": 0}).sort("display_order", 1).to_list(100)
    return videos

@api_router.post("/videos", response_model=dict)
async def create_video(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    display_order: int = Form(0),
    video: UploadFile = File(...),
    authorization: str = Header(None)
):
    await get_current_admin(authorization)
    
    video_id = str(uuid.uuid4())
    ext = Path(video.filename).suffix
    filename = f"{video_id}{ext}"
    filepath = VIDEOS_UPLOAD_DIR / filename
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    video_doc = {
        "id": video_id,
        "title": title,
        "description": description,
        "category": category,
        "display_order": display_order,
        "file_path": f"/uploads/videos/{filename}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.videos.insert_one(video_doc)
    
    return {"id": video_id, "message": "Video uploaded successfully"}

@api_router.delete("/videos/{video_id}")
async def delete_video(video_id: str, authorization: str = None):
    await get_current_admin(authorization)
    
    video = await db.videos.find_one({"id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete video file
    filepath = ROOT_DIR / video['file_path'].lstrip('/')
    if filepath.exists():
        filepath.unlink()
    
    await db.videos.delete_one({"id": video_id})
    return {"message": "Video deleted"}

# ==================== QUERY ROUTES ====================

@api_router.post("/queries", response_model=dict)
async def submit_query(data: QueryBase):
    query = Query(**data.model_dump())
    doc = query.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.queries.insert_one(doc)
    
    # Send emails (non-blocking)
    import asyncio
    asyncio.create_task(send_admin_notification(data.model_dump()))
    asyncio.create_task(send_customer_acknowledgement(data.email, data.name))
    
    return {"id": query.id, "message": "Query submitted successfully. We will get back to you shortly."}

@api_router.get("/queries", response_model=List[dict])
async def get_queries(authorization: str = None):
    await get_current_admin(authorization)
    queries = await db.queries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return queries

@api_router.put("/queries/{query_id}/status")
async def update_query_status(query_id: str, status: str, authorization: str = None):
    await get_current_admin(authorization)
    result = await db.queries.update_one({"id": query_id}, {"$set": {"status": status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Query not found")
    return {"message": "Query status updated"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial categories and sample products"""
    
    # Check if data already exists
    existing_categories = await db.categories.count_documents({})
    if existing_categories > 0:
        return {"message": "Data already seeded"}
    
    # Sample categories
    categories_data = [
        {"id": str(uuid.uuid4()), "name": "Industrial Valves", "description": "High-quality industrial valves for various applications", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Pumps & Motors", "description": "Efficient pumps and motors for industrial use", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Pipes & Fittings", "description": "Durable pipes and fittings for plumbing and industrial needs", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Power Tools", "description": "Professional-grade power tools", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.categories.insert_many(categories_data)
    
    # Sample subcategories
    subcategories_data = [
        {"id": str(uuid.uuid4()), "name": "Ball Valves", "category_id": categories_data[0]['id'], "description": "Ball valves for flow control", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Gate Valves", "category_id": categories_data[0]['id'], "description": "Gate valves for on/off control", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Centrifugal Pumps", "category_id": categories_data[1]['id'], "description": "High-efficiency centrifugal pumps", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Submersible Pumps", "category_id": categories_data[1]['id'], "description": "Submersible pumps for deep well applications", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "PVC Pipes", "category_id": categories_data[2]['id'], "description": "PVC pipes for various applications", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "GI Pipes", "category_id": categories_data[2]['id'], "description": "Galvanized iron pipes", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Drills", "category_id": categories_data[3]['id'], "description": "Industrial drills", "created_at": datetime.now(timezone.utc).isoformat()},
        {"id": str(uuid.uuid4()), "name": "Grinders", "category_id": categories_data[3]['id'], "description": "Angle and bench grinders", "created_at": datetime.now(timezone.utc).isoformat()},
    ]
    
    await db.subcategories.insert_many(subcategories_data)
    
    # Sample products with placeholder images
    products_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "Heavy Duty Ball Valve - 2 inch",
            "category_id": categories_data[0]['id'],
            "subcategory_id": subcategories_data[0]['id'],
            "description": "Premium quality 2-inch ball valve suitable for high-pressure applications. Made from stainless steel 316 for maximum durability and corrosion resistance.",
            "images": ["https://images.unsplash.com/photo-1650246363606-a2402ec42b08?w=600"],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Industrial Gate Valve - 4 inch",
            "category_id": categories_data[0]['id'],
            "subcategory_id": subcategories_data[1]['id'],
            "description": "Cast iron gate valve with rising stem design. Ideal for water and oil applications in industrial settings.",
            "images": ["https://images.unsplash.com/photo-1516247297293-e08212fef7a8?w=600"],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Centrifugal Pump - 5HP",
            "category_id": categories_data[1]['id'],
            "subcategory_id": subcategories_data[2]['id'],
            "description": "High-efficiency 5HP centrifugal pump with cast iron body. Suitable for water transfer, irrigation, and industrial processes.",
            "images": ["https://images.unsplash.com/photo-1632496498058-a3bb5998a4f6?w=600"],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Submersible Pump - 3HP",
            "category_id": categories_data[1]['id'],
            "subcategory_id": subcategories_data[3]['id'],
            "description": "Stainless steel submersible pump for borewell applications. Maximum head: 150 meters. Energy efficient design.",
            "images": ["https://images.unsplash.com/photo-1590239683804-b9f5725fe77c?w=600"],
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "PVC Pipe 4 inch - 6m length",
            "category_id": categories_data[2]['id'],
            "subcategory_id": subcategories_data[4]['id'],
            "description": "High-quality UPVC pipe conforming to IS 4985 standards. Pressure rating: 6 kg/cm². UV stabilized.",
            "images": ["https://images.unsplash.com/photo-1516247297293-e08212fef7a8?w=600"],
            "is_featured": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Industrial Angle Grinder - 9 inch",
            "category_id": categories_data[3]['id'],
            "subcategory_id": subcategories_data[7]['id'],
            "description": "Heavy-duty 9-inch angle grinder with 2400W motor. Variable speed control. Includes spindle lock for easy disc changes.",
            "images": ["https://images.unsplash.com/photo-1738162837369-a2beec3a1d47?w=600"],
            "is_featured": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
    ]
    
    await db.products.insert_many(products_data)
    
    return {"message": "Sample data seeded successfully", "categories": len(categories_data), "subcategories": len(subcategories_data), "products": len(products_data)}

# Include the router in the main app
app.include_router(api_router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
