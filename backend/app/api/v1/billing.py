import logging
import stripe
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.schemas.billing import CheckoutSessionResponse, BillingStatusResponse, PortalSessionResponse
from app.utils.auth import get_current_user
from app.utils.billing import FREE_GENERATION_LIMIT, FREE_SEND_LIMIT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["Billing"])


@router.get("/status", response_model=BillingStatusResponse)
def billing_status(user: User = Depends(get_current_user)):
    return BillingStatusResponse(
        plan=user.plan,
        emails_generated=user.emails_generated,
        emails_sent=user.emails_sent,
        free_generation_limit=FREE_GENERATION_LIMIT,
        free_send_limit=FREE_SEND_LIMIT,
        plan_expires_at=user.plan_expires_at.isoformat() if user.plan_expires_at else None,
    )


@router.post("/checkout", response_model=CheckoutSessionResponse)
def create_checkout_session(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY

    if not user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=user.email,
            metadata={"user_id": str(user.id)},
        )
        user.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=user.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/billing?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/billing",
        metadata={"user_id": str(user.id)},
    )
    return CheckoutSessionResponse(checkout_url=session.url)


@router.post("/portal", response_model=PortalSessionResponse)
def create_portal_session(
    user: User = Depends(get_current_user),
):
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY

    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing account found",
        )

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing",
    )
    return PortalSessionResponse(portal_url=session.url)


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events. No JWT auth — verified by Stripe signature."""
    settings = get_settings()
    stripe.api_key = settings.STRIPE_SECRET_KEY
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        _handle_checkout_completed(data_object, db)
    elif event_type == "customer.subscription.updated":
        _handle_subscription_updated(data_object, db)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data_object, db)

    return {"status": "ok"}


def _handle_checkout_completed(session: dict, db: Session):
    customer_id = session.get("customer")
    subscription_id = session.get("subscription")
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if user and subscription_id:
        user.stripe_subscription_id = subscription_id
        user.plan = "basic"
        settings = get_settings()
        stripe.api_key = settings.STRIPE_SECRET_KEY
        sub = stripe.Subscription.retrieve(subscription_id)
        user.plan_expires_at = datetime.fromtimestamp(sub.current_period_end, tz=timezone.utc)
        db.commit()
        logger.info("User %s upgraded to basic plan", user.id)


def _handle_subscription_updated(subscription: dict, db: Session):
    customer_id = subscription.get("customer")
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if user:
        status_val = subscription.get("status")
        if status_val == "active":
            user.plan = "basic"
            user.plan_expires_at = datetime.fromtimestamp(
                subscription["current_period_end"], tz=timezone.utc
            )
        elif status_val in ("past_due", "unpaid", "canceled"):
            user.plan = "free"
        user.stripe_subscription_id = subscription.get("id")
        db.commit()


def _handle_subscription_deleted(subscription: dict, db: Session):
    customer_id = subscription.get("customer")
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if user:
        user.plan = "free"
        user.stripe_subscription_id = None
        user.plan_expires_at = None
        db.commit()
        logger.info("User %s downgraded to free plan", user.id)
