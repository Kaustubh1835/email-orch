from pydantic import BaseModel


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class BillingStatusResponse(BaseModel):
    plan: str
    emails_generated: int
    emails_sent: int
    free_generation_limit: int
    free_send_limit: int
    plan_expires_at: str | None = None


class PortalSessionResponse(BaseModel):
    portal_url: str
