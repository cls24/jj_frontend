# -*- coding: UTF-8 -*-
from fastapi import FastAPI,Request
import uvicorn,json
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
app = FastAPI()

logging.basicConfig(
    filename="access.log",  # 日志文件名
    level=logging.INFO,     # 日志级别
    format="%(asctime)s - %(message)s"  # 日志格式
)

@app.get("/")
async def main():
    return {"message": "Hello，FastAPI"}

@app.middleware("http")
async def log_request(request: Request, call_next):
  # 获取客户端 IP 地址
  client_host = request.client.host if request.client else "unknown"

  # 获取请求方法和路径
  method = request.method
  path = request.url.path

  # 记录访问日志
  logging.info(f"IP: {client_host}, Method: {method}, Path: {path}")

  # 继续处理请求
  response = await call_next(request)

  # 记录响应状态码
  status_code = response.status_code
  logging.info(f"Status Code: {status_code}")

  return response

@app.get("/outBoundList/date/{strStartDate}/{strEndDate}")
async def getOutBoundList(strStartDate: str,strEndDate: str):
    with open('orders.json',encoding='utf8') as f:
        data = json.load(f)
    return data

@app.get("/outBoundList/{billnumberidstr}")
async def getOutBoundListDetail(billnumberidstr: str):
    print(billnumberidstr)
    # 93457 - XD - SJ - 2025 - 03 - 24
    l = billnumberidstr.split('-')
    with open('details.json',encoding='utf8') as f:
        data = json.load(f)
    return data['93457']


app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],  # 前端地址
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # 明确指定允许的方法
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=8000)
