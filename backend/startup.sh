#!/bin/bash
# Azure App Service startup script

# データベースマイグレーション（初回のみ）
# python -m alembic upgrade head

# アプリケーション起動
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000 --timeout 120
