from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


def quiet_exception_handler(exc, context):
    """
    SimpleJWT's default message for an invalid/expired/tampered token
    ("Given token not valid for any token type") is a verbatim, googleable
    library string - same fingerprinting problem as the login failure
    message in QuietTokenObtainPairSerializer, but this one fires on *every*
    authenticated endpoint (verify, refresh, ws-ticket, etc.) whenever a
    token is stale, not just at login. Applied globally via
    REST_FRAMEWORK["EXCEPTION_HANDLER"] rather than patched per-view, since
    any JWTAuthentication-protected endpoint can raise it.
    """
    response = drf_exception_handler(exc, context)
    if response is not None and isinstance(exc, (InvalidToken, TokenError)):
        response.data = {"detail": "Your session has expired. Please sign in again."}
    return response
