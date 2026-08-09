from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/")
def home():
    return {"message": "FastAPI is running!"}

@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.json()

    print("Received webhook payload:", payload)
    return {"status": "Webhook received successfully!"}