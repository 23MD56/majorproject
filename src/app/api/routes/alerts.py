"""REST API routes for Smart Alerts and Web Push notifications."""

from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request

from app.core.models import (
    AlertSeverity,
    EvaluateAlertsResponse,
    PushSubscriptionRequest,
    SmartAlert,
    SmartAlertsResponse,
    SmartAlertType,
)
from app.ml.alerts.service import AlertService

router = APIRouter(tags=["Smart Alerts & Notifications"])


def get_alert_service(request: Request) -> AlertService:
    """Retrieve or lazily initialize AlertService from application state."""
    if hasattr(request.app.state, "alert_service") and request.app.state.alert_service is not None:
        return request.app.state.alert_service

    service = AlertService()
    request.app.state.alert_service = service
    return service


@router.get("/alerts", response_model=SmartAlertsResponse)
def list_alerts(
    request: Request,
    type: Optional[SmartAlertType] = Query(None, description="Filter by Smart Alert type"),
    unread_only: bool = Query(False, description="Filter to only unread notifications"),
):
    """Retrieve list of active Smart Alerts."""
    service = get_alert_service(request)
    all_alerts = service.get_alerts()
    filtered = service.get_alerts(type=type, unread_only=unread_only)
    unread_cnt = sum(1 for a in all_alerts if not a.read)

    return SmartAlertsResponse(
        alerts=filtered,
        total=len(filtered),
        unread_count=unread_cnt,
    )


@router.post("/alerts/evaluate", response_model=EvaluateAlertsResponse)
def evaluate_alerts_micro_batch(request: Request):
    """Trigger on-demand micro-batch evaluation across all 6 quantitative trigger conditions."""
    service = get_alert_service(request)
    market_svc = getattr(request.app.state, "market_service", None)
    regime_svc = getattr(request.app.state, "regime_service", None)
    portfolio_svc = getattr(request.app.state, "portfolio_service", None)
    explore_svc = getattr(request.app.state, "explore_service", None)

    new_alerts = service.evaluate_micro_batch(
        market_service=market_svc,
        regime_service=regime_svc,
        portfolio_service=portfolio_svc,
        explore_service=explore_svc,
    )

    return EvaluateAlertsResponse(
        evaluated_at=datetime.now(timezone.utc).isoformat(),
        new_alerts_count=len(new_alerts),
        alerts=new_alerts,
    )


@router.patch("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: str, request: Request):
    """Mark a specific Smart Alert as read."""
    service = get_alert_service(request)
    ok = service.mark_as_read(alert_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return {"status": "ok", "alert_id": alert_id, "read": True}


@router.post("/alerts/mark-all-read")
def mark_all_alerts_read(request: Request):
    """Mark all active Smart Alerts as read."""
    service = get_alert_service(request)
    updated = service.mark_all_as_read()
    return {"status": "ok", "updated": updated}


@router.delete("/alerts")
def clear_alerts(request: Request):
    """Clear all active Smart Alerts."""
    service = get_alert_service(request)
    cleared = service.clear_alerts()
    return {"status": "ok", "cleared": cleared}


# =====================================================================
# Web Push & Notification Subscription Endpoints
# =====================================================================

@router.get("/notifications/vapid-public-key")
def get_vapid_public_key(request: Request):
    """Retrieve VAPID public key for browser push subscription."""
    service = get_alert_service(request)
    return {"public_key": service.vapid_public_key}


@router.post("/notifications/subscribe")
def subscribe_web_push(payload: PushSubscriptionRequest, request: Request):
    """Register client Web Push notification subscription credentials."""
    service = get_alert_service(request)
    service.register_push_subscription(payload)
    return {"status": "subscribed", "endpoint": payload.endpoint}


@router.post("/notifications/test-push")
def send_test_push_notification(request: Request):
    """Dispatch a test Smart Alert notification across push channels."""
    service = get_alert_service(request)
    test_alert = SmartAlert(
        id=f"test-push-{int(datetime.now(timezone.utc).timestamp())}",
        type=SmartAlertType.REGIME_TRANSITION,
        severity=AlertSeverity.INFO,
        title="QuantNiti Smart Alerts Active",
        message="Web Push and real-time smart risk guardrails are connected successfully.",
        timestamp=datetime.now(timezone.utc).isoformat(),
        trust_card_context="Proactive signal delivery initialized for regime changes and portfolio drift.",
    )
    service.add_alert(test_alert)
    return {"status": "dispatched", "dispatched": True, "alert": test_alert}
