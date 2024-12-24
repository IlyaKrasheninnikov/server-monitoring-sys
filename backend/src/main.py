from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from starlette.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from starlette.responses import JSONResponse

from .config import get_settings
from .services.website_monitor import WebsiteMonitorService
from .models.website import WebsiteCheck

settings = get_settings()
monitor_service = WebsiteMonitorService(settings.mongodb_uri)


def ensure_protocol(url: str) -> str:
    if '.' not in url: return None
    if not url.startswith(('http://', 'https://')): url = 'https://' + url
    if not url.endswith('/'): url += '/'
    return url


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler(timezone='UTC')
    scheduler.add_job(
        func=periodic_monitoring,
        trigger='interval',
        seconds=settings.monitoring_interval
    )
    scheduler.start()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def periodic_monitoring():
    websites = await monitor_service.websites_collection.find().to_list(length=None)
    for website in websites:
        await monitor_service.get_website_status(website['url'])


@app.get("/health")
async def health_check():
    try:
        await monitor_service.websites_collection.find_one()
        return JSONResponse(
            status_code=200,
            content={"status": "healthy", "message": "Service is running"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "message": str(e)}
        )


@app.get("/monitor/status/{url:path}", response_model=WebsiteCheck)
async def get_website_status(url: str):
    url = ensure_protocol(url)
    try:
        return await monitor_service.get_website_info(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/monitor/report/{url:path}")
async def report_issue(url: str):
    url = ensure_protocol(url)
    try:
        await monitor_service.save_report(url)
        await monitor_service.serve_last_reported(url)
        return {"message": "Report submitted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/monitor/outage-history/{url:path}")
async def get_outage_history(url: str):
    url = ensure_protocol(url)
    try:
        history = await monitor_service.get_outage_history(url)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/monitor/last-reported")
async def get_last_reported():
    try:
        return await monitor_service.get_last_reported()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
