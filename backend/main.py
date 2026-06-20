from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models.books
import models.documentaries
import models.body
import models.finance
import models.stock
import models.language
import models.diet
import models.tasks
import models.investment

from routers import books, documentaries, body, finance, stock, language, diet, tasks, dashboard, investment, grocery

# 启动时自动建表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="个人生活自我管理平台", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3456"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router)
app.include_router(documentaries.router)
app.include_router(body.router)
app.include_router(finance.router)
app.include_router(stock.router)
app.include_router(language.router)
app.include_router(diet.router)
app.include_router(tasks.router)
app.include_router(dashboard.router)
app.include_router(investment.router)
app.include_router(grocery.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "个人生活自我管理平台 API"}
