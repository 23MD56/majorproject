"""Health check route."""

from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": "quantniti",
    }
