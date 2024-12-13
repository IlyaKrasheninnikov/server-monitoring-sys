from collections import Counter
from urllib.parse import urlparse
from fastapi import FastAPI, BackgroundTasks, HTTPException
from starlette.middleware.cors import CORSMiddleware
from dataclasses import dataclass, field
from fastapi_utils.api_model import APIModel
from typing import List, Optional
import asyncio
import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from pydantic import BaseModel, Field


def ensure_protocol(url: str) -> str:
    url = url + "/" if url[-1] != '/' else 'url'
    parsed_url = urlparse(url)
    if not parsed_url.scheme:
        return f"https://{url}"
    return url


@dataclass
class WebsiteHistoryEntry:
    response_time: int
    last_checked: datetime = field(default_factory=datetime.now)


@dataclass
class WebsiteCheck:
    url: str
    status: str
    response_time: float
    last_down: str
    last_checked: datetime = field(default_factory=datetime.now)
    is_down: bool = False
    history: List[WebsiteHistoryEntry] = field(default_factory=list)
    _id: Optional[str] = None

    def to_dict(self):
        return {
            "url": self.url,
            "status": self.status,
            "response_time": self.response_time,
            "last_checked": self.last_checked,
            "is_down": self.is_down,
            "history": [
                {
                    "response_time": entry.response_time,
                    "last_checked": entry.last_checked
                }
                for entry in self.history
            ]
        }


class WebsiteMonitorService:
    def __init__(self, mongodb_uri: str):
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.client.website_monitor
        self.websites_collection = self.db.websites
        self.reports_collection = self.db.reports

    async def _fetch_website(self, url: str):
        async with httpx.AsyncClient() as client:
            start_time = datetime.now()
            response = await client.get(url, timeout=10)
            end_time = datetime.now()
            return response, start_time, end_time

    async def _get_last_down(self, url: str):
        website_obj = await self.websites_collection.find_one({'url': url})
        if not website_obj:
            return None
        history = website_obj["history"]
        down_events = [event for event in history if event.get("response_time") == 0]
        if not down_events:
            return None
        last_down_event = max(down_events, key=lambda event: event["last_checked"])
        return last_down_event["last_checked"]


    async def _process_website_history(self, url: str, response_time: float) -> List[
        WebsiteHistoryEntry]:
        website_obj = await self.websites_collection.find_one({'url': url})
        new_history = website_obj.get('history', []) if website_obj else []

        new_history.append({
            "response_time": int(response_time),
            "last_checked": datetime.now()
        })
        return [WebsiteHistoryEntry(**entry) for entry in new_history]

    async def check_website_status(self, url: str) -> WebsiteCheck:
        try:
            response, start_time, end_time = await self._fetch_website(url)
            response_time = round((end_time - start_time).total_seconds() * 1000, 2)
            status_code = response.status_code
            is_down = status_code >= 400
            last_down = await self._get_last_down(url)
            if not last_down:
                last_down = "Never"
            else:
                last_down = last_down.strftime("%d.%m.%Y %H:%M:%S")
            history = await self._process_website_history(url, response_time)
            website_check = WebsiteCheck(
                url=url,
                status=str(status_code),
                response_time=response_time,
                last_checked=datetime.now(),
                is_down=is_down,
                history=history,
                last_down=last_down
            )
            await self.save_website_status(website_check)
            return website_check

        except Exception as e:
            print(e)
            history = await self._process_website_history(url, 0)
            website_check = WebsiteCheck(
                url=url,
                status='Error',
                response_time=0,
                is_down=True,
                history=history,
                last_down=datetime.now().strftime("%d.%m.%Y %H:%M:%S")
            )
            await self.save_website_status(website_check)
            return website_check

    async def save_website_status(self, website_check: WebsiteCheck):
        website_check_dict = website_check.to_dict()
        await self.websites_collection.update_one(
            {"url": website_check.url},
            {"$set": website_check_dict},
            upsert=True
        )

    async def get_or_create_website_status(self, url: str):
        return await self.check_website_status(url)

    async def save_report(self, url: str):

        await self.reports_collection.update_one(
            {"url": url},
            {"$push": {"history": datetime.now()}},
            upsert=True
        )

    from datetime import datetime, timedelta
    from collections import Counter

    async def get_outage_history(self, url: str) -> List[dict]:
        now = datetime.now()
        past_24_hours = now - timedelta(hours=24)

        document = await self.reports_collection.find_one(
            {"url": url, "history": {"$gte": past_24_hours}}
        )

        if not document:
            return []

        def round_to_nearest_15min(dt):
            return dt.replace(second=0, microsecond=0, minute=(dt.minute // 15) * 15)

        all_intervals = []
        interval_start = past_24_hours.replace(second=0, microsecond=0,
                                               minute=0)
        while interval_start <= now:
            all_intervals.append(interval_start)
            interval_start += timedelta(minutes=15)

        time_intervals = []
        for timestamp in document["history"]:
            rounded_time = round_to_nearest_15min(timestamp)
            time_intervals.append(rounded_time)

        interval_counts = Counter(time_intervals)

        filled_data = []
        for interval in all_intervals:
            count = interval_counts.get(interval, 0)
            filled_data.append({"name": interval.strftime('%Y-%m-%d %H:%M'), "reportCount": count})
        return filled_data


class MonitoringStartResponse(APIModel):
    message: str
    url: str
    timestamp: datetime = Field(default_factory=datetime.now)


MONGODB_URI = "mongodb://localhost:27017"
FRONTEND_ORIGINS = ["http://localhost:3000"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

monitor_service = WebsiteMonitorService(MONGODB_URI)


@app.post("/monitor/check", response_model=MonitoringStartResponse)
async def monitor_website(url: str, background_tasks: BackgroundTasks):
    url = ensure_protocol(url)
    background_tasks.add_task(monitor_service.check_website_status, url)
    return MonitoringStartResponse(message="Monitoring started", url=url)


@app.get("/monitor/status/{url:path}")
async def get_website_status(url: str):
    url = ensure_protocol(url)
    try:
        return await monitor_service.get_or_create_website_status(url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/monitor/report/{url:path}")
async def report_issue(url: str):
    try:
        await monitor_service.save_report(url)
        return {"message": "Report submitted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/monitor/outage-history/{url:path}")
async def get_outage_history(url: str):
    try:
        history = await monitor_service.get_outage_history(url)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def periodic_monitoring():
    websites = await monitor_service.websites_collection.find().to_list(1000)
    for website in websites:
        await monitor_service.check_website_status(website['url'])


if __name__ == "__main__":
    asyncio.create_task(periodic_monitoring())