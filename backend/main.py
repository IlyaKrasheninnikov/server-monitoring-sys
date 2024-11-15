from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from prometheus_client import start_http_server, Counter, Gauge, generate_latest
import aiohttp
import asyncio
import os
from datetime import datetime
from typing import List, Dict

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
mongodb_client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
db = mongodb_client.monitoring

# Prometheus metrics
ENDPOINT_UP = Gauge("endpoint_up", "Endpoint availability", ["endpoint"])
RESPONSE_TIME = Gauge("response_time_seconds", "Response time in seconds", ["endpoint"])
CHECK_COUNT = Counter("endpoint_checks_total", "Total number of endpoint checks", ["endpoint"])

# List of endpoints to monitor
ENDPOINTS = [
    {"url": "https://github.com", "name": "GitHub"},
    {"url": "https://vk.com", "name": "VK"},
    {"url": "https://api.telegram.org", "name": "Telegram"}
]


async def check_endpoint(session: aiohttp.ClientSession, endpoint: Dict):
    try:
        start_time = datetime.now()
        async with session.get(endpoint["url"]) as response:
            response_time = (datetime.now() - start_time).total_seconds()

            # Update Prometheus metrics
            ENDPOINT_UP.labels(endpoint["name"]).set(1 if response.status == 200 else 0)
            RESPONSE_TIME.labels(endpoint["name"]).set(response_time)
            CHECK_COUNT.labels(endpoint["name"]).inc()

            # Store in MongoDB
            await db.status_checks.insert_one({
                "endpoint": endpoint["name"],
                "url": endpoint["url"],
                "status": response.status,
                "response_time": response_time,
                "timestamp": datetime.utcnow()
            })

            return {
                "endpoint": endpoint["name"],
                "status": "up" if response.status == 200 else "down",
                "response_time": response_time
            }
    except Exception as e:
        ENDPOINT_UP.labels(endpoint["name"]).set(0)
        return {
            "endpoint": endpoint["name"],
            "status": "down",
            "error": str(e)
        }


# Serve the static folder containing the static
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/stats", response_class=HTMLResponse)
async def get_dashboard():
    return HTMLResponse(open("static/index.html").read())


@app.on_event("startup")
async def startup_event():
    # Start Prometheus metrics server on a different port
    start_http_server(8001)


@app.get("/status")
async def get_status():
    async with aiohttp.ClientSession() as session:
        tasks = [check_endpoint(session, endpoint) for endpoint in ENDPOINTS]
        results = await asyncio.gather(*tasks)
        return results


@app.get("/history/{endpoint_name}")
async def get_history(endpoint_name: str):
    cursor = db.status_checks.find(
        {"endpoint": endpoint_name},
        {"_id": 0}
    ).sort("timestamp", -1).limit(100)

    history = await cursor.to_list(length=100)
    return history


@app.get("/metrics")
async def metrics():
    # Expose Prometheus metrics
    return Response(generate_latest(), media_type="text/plain")
