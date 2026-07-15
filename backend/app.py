import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import router
from utils import configure_app_logging, create_error_response
import config
import uvicorn

# Configure root logger
configure_app_logging()
logger = logging.getLogger("app")

# Initialize FastAPI application
app = FastAPI(
    title="Serverless File Processing System API",
    description="Backend API for uploading text files to S3 to trigger serverless processing.",
    version="1.0.0"
)

# Enable CORS (Cross-Origin Resource Sharing)
# Since the frontend runs from a local server (e.g. index.html) or specific port,
# we permit all origins for local testing convenience.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Set to False when using "*" wildcard origin
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """
    Catches FastAPI HTTPExceptions and returns them in our standardized
    error JSON response structure.
    """
    logger.warning(f"HTTPException caught: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(
            message=exc.detail,
            error_detail=f"HTTP Status {exc.status_code}"
        )
    )

@app.exception_handler(Exception)
async def custom_general_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled exceptions and returns a generic 500 error response.
    """
    logger.exception(f"Unhandled system exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=create_error_response(
            message="An unexpected system error occurred on the server.",
            error_detail=str(exc)
        )
    )

# Include endpoint routes
app.include_router(router)

logger.info("FastAPI application has been initialized successfully.")

if __name__ == "__main__":
    uvicorn.run("app:app", host=config.HOST, port=config.PORT, reload=True)
