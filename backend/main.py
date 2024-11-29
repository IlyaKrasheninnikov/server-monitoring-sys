from urllib.parse import urlparse
from fastapi import FastAPI, BackgroundTasks, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime


def ensure_protocol(url: str) -> str:
    if url[-1] != "/":
        url = url + "/"
    parsed_url = urlparse(url)
    if not parsed_url.scheme:
        return f"https://{url}"
    return url


# Your existing classes and methods
class WebsiteCheck:
    def __init__(self, url, status, response_time, last_checked, is_down, history=None, _id=None):
        self.url = url
        self.status = status
        self.response_time = response_time
        self.last_checked = last_checked if isinstance(last_checked,
                                                       datetime) else datetime.now()  # Ensure datetime type
        self.is_down = is_down
        self.history = history if history is not None else []
        self._id = _id

    def to_dict(self):
        result = {
            "url": self.url,
            "status": self.status,
            "response_time": self.response_time,
            "last_checked": self.last_checked.isoformat() if isinstance(self.last_checked,
                                                                        datetime) else self.last_checked,
            "is_down": self.is_down,
            "history": self.history,
        }

        if self._id:
            result["_id"] = str(self._id)  # Convert ObjectId to string

        return result


class WebsiteMonitorService:
    def __init__(self, mongodb_uri):
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.client.website_monitor
        self.websites_collection = self.db.websites

    async def check_website_status(self, url):
        try:
            start_time = datetime.now()
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10)
                end_time = datetime.now()
            response_time = round((end_time - start_time).total_seconds() * 1000, 2)
            status_code = response.status_code
            is_down = status_code >= 400
            website_obj = await self.websites_collection.find_one({'url': url})
            new_history = website_obj['history'] if website_obj else []
            new_history.append({
                "response_time": int(response_time),
                "last_checked": datetime.now().isoformat()
            })
            print(new_history)
            website_check = WebsiteCheck(
                url=url,
                status=str(status_code),
                response_time=response_time,
                last_checked=datetime.now(),
                is_down=is_down,
                history=new_history
            )
            await self.save_website_status(website_check)
            return website_check.to_dict()

        except Exception as e:
            print(e)
            website_check = WebsiteCheck(
                url=url,
                status='Error',
                response_time=0,
                last_checked=datetime.now(),
                is_down=True
            )
            await self.save_website_status(website_check)
            return website_check

    async def save_website_status(self, website_check: WebsiteCheck):
        website_check_dict = website_check.to_dict()

        if website_check._id:
            website_check_dict["_id"] = website_check._id

        await self.websites_collection.update_one(
            {"url": website_check.url},
            {"$set": website_check_dict},
            upsert=True
        )

    async def get_or_create_website_status(self, url):
        existing_status = await self.check_website_status(url)

        return existing_status


# Create FastAPI instance
app = FastAPI()

# Enable CORS
origins = [
    "http://localhost:3000"  # Allow frontend running on this URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specify which origins are allowed
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods like GET, POST, etc.
    allow_headers=["*"],  # Allow all headers
)

monitor_service = WebsiteMonitorService("mongodb://localhost:27017")


@app.post("/monitor/check")
async def monitor_website(url: str, background_tasks: BackgroundTasks):
    url = ensure_protocol(url)
    background_tasks.add_task(monitor_service.check_website_status, url)
    return {"message": "Monitoring started"}


@app.get("/monitor/status/{url:path}")
async def get_website_status(url: str):
    url = ensure_protocol(url)
    try:
        status = await monitor_service.get_or_create_website_status(url)

        website_check = WebsiteCheck(**status)
        return website_check.to_dict()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def periodic_monitoring():
    websites = await monitor_service.websites_collection.find().to_list(1000)
    for website in websites:
        await monitor_service.check_website_status(website['url'])


if __name__ == "__main__":
    # Periodic monitoring should be integrated further (asyncio is temporary solution)
    asyncio.create_task(periodic_monitoring())
