from typing import Optional, Tuple

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse, Response
from rembg import remove

app = FastAPI(title="Signature Background Removal Service")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


async def _read_image_payload(request: Request, file: Optional[UploadFile]) -> Tuple[bytes, str]:
    if file is not None:
        data = await file.read()
        content_type = file.content_type or "application/octet-stream"
    else:
        data = await request.body()
        content_type = request.headers.get("content-type", "application/octet-stream")

    if not data:
        raise HTTPException(status_code=400, detail="Empty image payload")

    return data, content_type


@app.post("/process")
async def process_signature(request: Request, file: Optional[UploadFile] = File(default=None)):
    """
    Accepts a signature image and returns a transparent PNG with the background removed.
    """
    image_bytes, _content_type = await _read_image_payload(request, file)

    try:
        processed = remove(image_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to remove background: {exc}") from exc

    return Response(content=processed, media_type="image/png")


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001)
