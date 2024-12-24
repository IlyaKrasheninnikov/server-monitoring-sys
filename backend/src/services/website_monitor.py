from datetime import datetime, timedelta
from collections import Counter
from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorClient
import httpx

from ..models.website import WebsiteCheck, WebsiteHistoryEntry, OutageReport


class WebsiteMonitorService:
    def __init__(self, mongodb_uri: str):
        self.client = AsyncIOMotorClient(mongodb_uri)
        self.db = self.client.website_monitor
        self.websites_collection = self.db.websites
        self.reports_collection = self.db.reports

    async def _fetch_website(self, url: str) -> tuple[httpx.Response, datetime, datetime]:
        async with httpx.AsyncClient() as client:
            start_time = datetime.now()
            response = await client.get(url, timeout=10)
            end_time = datetime.now()
            return response, start_time, end_time

    async def _get_last_down(self, url: str) -> Optional[datetime]:
        website_obj = await self.websites_collection.find_one({'url': str(url)})
        if not website_obj:
            return None

        history = website_obj.get("history", [])
        down_events = [event for event in history if event.get("response_time") == 0]
        if not down_events:
            return None

        last_down_event = max(down_events, key=lambda event: event["last_checked"])
        return last_down_event["last_checked"]

    async def _process_website_history(self, url: str, response_time: float) -> List[WebsiteHistoryEntry]:
        now = datetime.now()
        past_24_hours = now - timedelta(hours=24)

        website_obj = await self.websites_collection.find_one({'url': str(url)})
        new_history = website_obj.get('history', []) if website_obj else []

        filtered_history = [
            entry for entry in new_history
            if entry['last_checked'] >= past_24_hours
        ]

        filtered_history.append({
            "response_time": int(response_time),
            "last_checked": now
        })

        return [WebsiteHistoryEntry(**entry) for entry in filtered_history]


    async def get_website_info(self, url: str) -> WebsiteCheck:
        website_obj = await self.websites_collection.find_one({'url': str(url)})
        if not website_obj:
            await self.get_website_status(url)
        return WebsiteCheck.from_dict(website_obj)

    async def get_website_status(self, url: str) -> WebsiteCheck:
        try:
            response, start_time, end_time = await self._fetch_website(url)
            response_time = round((end_time - start_time).total_seconds() * 1000, 2)
            status_code = response.status_code
            is_down = status_code >= 400

            last_down = await self._get_last_down(url)
            last_down_str = "Never" if not last_down else last_down.strftime("%d.%m.%Y %H:%M:%S")

            history = await self._process_website_history(url, response_time)

            website_check = WebsiteCheck(
                url=url,
                status=str(status_code),
                response_time=response_time,
                last_checked=datetime.now(),
                is_down=is_down,
                history=history,
                last_down=last_down_str
            )

        except Exception as e:
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
            {"url": str(website_check.url)},
            {"$set": website_check_dict},
            upsert=True
        )

    async def save_report(self, url: str):
        await self.reports_collection.update_one(
            {"url": str(url)},
            {"$push": {"history": datetime.now()}},
            upsert=True
        )

    async def get_outage_history(self, url: str) -> List[OutageReport]:
        now = datetime.now()
        past_24_hours = now - timedelta(hours=24)

        document = await self.reports_collection.find_one(
            {"url": str(url), "history": {"$gte": past_24_hours}}
        )

        def round_to_nearest_15min(dt: datetime) -> datetime:
            return dt.replace(second=0, microsecond=0, minute=(dt.minute // 15) * 15)

        all_intervals = []
        interval_start = past_24_hours.replace(second=0, microsecond=0, minute=0)
        while interval_start <= now:
            all_intervals.append(interval_start)
            interval_start += timedelta(minutes=15)

        time_intervals = []
        if document:
            for timestamp in document["history"]:
                rounded_time = round_to_nearest_15min(timestamp)
                time_intervals.append(rounded_time)

        interval_counts = Counter(time_intervals)

        return [
            OutageReport(
                name=interval.strftime('%Y-%m-%d %H:%M'),
                reportCount=interval_counts.get(interval, 0)
            )
            for interval in all_intervals
        ]
