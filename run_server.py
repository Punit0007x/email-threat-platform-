import sys
import asyncio
import os

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import uvicorn

if __name__ == "__main__":
    print("[RUN_SERVER] Starting Uvicorn server on http://127.0.0.1:8000 ...", flush=True)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, log_level="info", access_log=True)
