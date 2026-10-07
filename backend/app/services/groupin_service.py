import asyncio
import hashlib
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class AccountCheckData:
    def __init__(
        self,
        mobile_number: str,
        account_exists: bool,
        user_id: Optional[str] = None,
        name: Optional[str] = None,
        status: str = "Active",
        error: Optional[str] = None,
        # Extended profile fields
        email: Optional[str] = None,
        dob: Optional[str] = None,
        alternate_phone: Optional[str] = None,
        about: Optional[str] = None,
        location: Optional[str] = None,
        user_type: Optional[str] = None,
        last_active: Optional[str] = None,
        registered_on: Optional[str] = None,
        verified: Optional[bool] = None,
    ):
        self.mobile_number = mobile_number
        self.account_exists = account_exists
        self.user_id = user_id
        self.name = name
        self.status = status
        self.error = error
        self.email = email
        self.dob = dob
        self.alternate_phone = alternate_phone
        self.about = about
        self.location = location
        self.user_type = user_type
        self.last_active = last_active
        self.registered_on = registered_on
        self.verified = verified

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mobile_number": self.mobile_number,
            "account_exists": self.account_exists,
            "user_id": self.user_id,
            "name": self.name,
            "status": self.status,
            "error": self.error,
            "email": self.email,
            "dob": self.dob,
            "alternate_phone": self.alternate_phone,
            "about": self.about,
            "location": self.location,
            "user_type": self.user_type,
            "last_active": self.last_active,
            "registered_on": self.registered_on,
            "verified": self.verified,
        }

class BaseGroupinService(ABC):
    @abstractmethod
    async def check_account(self, mobile_number: str) -> AccountCheckData:
        pass

    @abstractmethod
    async def check_accounts(self, mobile_numbers: List[str]) -> List[AccountCheckData]:
        pass

class MockGroupinService(BaseGroupinService):
    """
    High-fidelity Mock Service simulating realistic Groupin API responses,
    deterministic pseudo-random user records based on phone number hash,
    and simulated latency.
    """
    FIRST_NAMES = ["Aarav", "Diya", "Rohan", "Ananya", "Vikram", "Pooja", "Sanjay", "Neha", "Arjun", "Kavita", "Aditya", "Meera", "Karan", "Sneha", "Rahul", "Priya"]
    LAST_NAMES = ["Sharma", "Patel", "Verma", "Reddy", "Malhotra", "Joshi", "Singhania", "Kapoor", "Nair", "Rao", "Gupta", "Mehta", "Iyer", "Kumar", "Singh", "Das"]
    EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "rediffmail.com"]
    LOCATIONS = ["Mumbai, Maharashtra", "Bengaluru, Karnataka", "Delhi, NCT", "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Pune, Maharashtra", "Kolkata, West Bengal", "Ahmedabad, Gujarat", "Jaipur, Rajasthan", "Surat, Gujarat"]
    ABOUT_TEXTS = [
        "Entrepreneur & tech enthusiast",
        "Business owner | Love travel & food",
        "Digital marketer and content creator",
        "Finance professional | Cricket fan",
        "Software engineer at a product startup",
        "Freelance designer & photographer",
        "Retailer | Family person | Foodie",
        "Sales professional | Fitness enthusiast",
        "Teacher & lifelong learner",
        "E-commerce seller | Avid reader"
    ]
    USER_TYPES = ["Individual", "Business", "Enterprise"]

    def _generate_mock_user(self, mobile: str) -> AccountCheckData:
        # Deterministic hash based on mobile number
        h = int(hashlib.md5(mobile.encode("utf-8")).hexdigest(), 16)
        
        # 90% chance account exists (for realistic demo coverage)
        account_exists = (h % 100) < 90
        
        if not account_exists:
            return AccountCheckData(
                mobile_number=mobile,
                account_exists=False,
                status="Not Registered"
            )
            
        first_idx = (h >> 4) % len(self.FIRST_NAMES)
        last_idx = (h >> 8) % len(self.LAST_NAMES)
        user_num = 10000 + (h % 90000)
        email_domain_idx = (h >> 12) % len(self.EMAIL_DOMAINS)
        location_idx = (h >> 16) % len(self.LOCATIONS)
        about_idx = (h >> 20) % len(self.ABOUT_TEXTS)
        user_type_idx = (h >> 24) % len(self.USER_TYPES)

        first = self.FIRST_NAMES[first_idx]
        last = self.LAST_NAMES[last_idx]
        name = f"{first} {last}"
        user_id = f"GP{user_num}"
        email = f"{first.lower()}.{last.lower()}{(h % 99) or ''}@{self.EMAIL_DOMAINS[email_domain_idx]}"
        location = self.LOCATIONS[location_idx]
        about = self.ABOUT_TEXTS[about_idx]
        user_type = self.USER_TYPES[user_type_idx]

        # Deterministic DOB: birth year 1975-2000, random month/day
        birth_year = 1975 + (h % 26)
        birth_month = 1 + ((h >> 6) % 12)
        birth_day = 1 + ((h >> 9) % 28)
        dob = f"{birth_day:02d} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][birth_month-1]} {birth_year}"

        # Deterministic alternate phone (different suffix)
        alt_suffix = str(6000000000 + (h % 3999999999)).zfill(10)
        alternate_phone = f"+91 {alt_suffix[:5]} {alt_suffix[5:]}"

        # Deterministic registration date: 2019-2024
        reg_year = 2019 + (h % 6)
        reg_month = 1 + ((h >> 3) % 12)
        reg_day = 1 + ((h >> 7) % 28)
        registered_on = f"{reg_day:02d} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][reg_month-1]} {reg_year}"

        # Last active: recent months in 2026
        last_active_month_offset = h % 9  # 0-8 months ago from Oct 2026
        last_active_month = 10 - last_active_month_offset
        last_active_year = 2026 if last_active_month > 0 else 2025
        if last_active_month <= 0:
            last_active_month += 12
        last_active_day = 1 + ((h >> 11) % 27)
        last_active = f"{last_active_day:02d} {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][last_active_month-1]} {last_active_year}"

        # 95% Active, 5% Inactive/Suspended
        is_active = (h % 20) != 0
        status = "Active" if is_active else "Suspended"
        verified = (h % 5) != 0  # 80% verified
        
        return AccountCheckData(
            mobile_number=mobile,
            account_exists=True,
            user_id=user_id,
            name=name,
            status=status,
            email=email,
            dob=dob,
            alternate_phone=alternate_phone,
            about=about,
            location=location,
            user_type=user_type,
            last_active=last_active,
            registered_on=registered_on,
            verified=verified,
        )

    async def check_account(self, mobile_number: str) -> AccountCheckData:
        await asyncio.sleep(0.05)  # Simulate network latency
        return self._generate_mock_user(mobile_number)

    async def check_accounts(self, mobile_numbers: List[str]) -> List[AccountCheckData]:
        # Simulate slight batch network delay
        delay_sec = max(0.02, min(0.3, settings.GROUPIN_REQUEST_DELAY_MS / 1000.0))
        await asyncio.sleep(delay_sec)
        return [self._generate_mock_user(m) for m in mobile_numbers]

class HttpGroupinService(BaseGroupinService):
    """
    Live Groupin Contacts Verification client.
    Connects to: POST https://stag-saas-messagebot.tech-v2.groupin.app/api/v1/contacts/check-registered
    Authenticated via x-api-key header.
    Request body: {"phone_numbers": ["..."]} (receives n contacts max 10k).
    """
    def __init__(self):
        self.api_url = settings.CONTACTS_CHECK_URL or settings.GROUPIN_API_URL
        self.api_key = settings.CONTACTS_API_KEY or settings.GROUPS_API_KEY or settings.GROUPIN_API_KEY
        self.timeout = settings.GROUPIN_REQUEST_TIMEOUT
        self.max_retries = settings.GROUPIN_MAX_RETRIES

        if not self.api_url:
            raise ValueError("CONTACTS_CHECK_URL must be configured in backend/.env")
        if not self.api_key:
            raise ValueError("CONTACTS_API_KEY or GROUPS_API_KEY must be configured in backend/.env")

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        if self.api_key:
            headers["x-api-key"] = self.api_key
        return headers

    async def check_account(self, mobile_number: str) -> AccountCheckData:
        results = await self.check_accounts([mobile_number])
        if results:
            return results[0]
        return AccountCheckData(
            mobile_number=mobile_number,
            account_exists=False,
            status="Failed",
            error="No response returned from verification service"
        )

    async def check_accounts(self, mobile_numbers: List[str]) -> List[AccountCheckData]:
        if not mobile_numbers:
            return []

        payload = {"phone_numbers": mobile_numbers}
        headers = self._get_headers()

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(self.api_url, json=payload, headers=headers)

                    if resp.status_code == 429:  # Rate limited
                        retry_after = int(resp.headers.get("Retry-After", 2 * attempt))
                        logger.warning(f"Rate limited (429). Retrying in {retry_after}s...")
                        await asyncio.sleep(retry_after)
                        continue

                    if resp.status_code >= 500:
                        logger.warning(f"Server error {resp.status_code}. Retrying attempt {attempt}...")
                        await asyncio.sleep(1 * attempt)
                        continue

                    if resp.status_code != 200:
                        logger.error(f"Unexpected status code {resp.status_code}: {resp.text}")
                        if attempt == self.max_retries:
                            return [
                                AccountCheckData(
                                    mobile_number=m,
                                    account_exists=False,
                                    status="Failed",
                                    error=f"API error: {resp.status_code}"
                                )
                                for m in mobile_numbers
                            ]
                        await asyncio.sleep(1 * attempt)
                        continue

                    data = resp.json()
                    # Structure: {"status": "success", "data": {"results": [{"phone": "...", "is_valid": True, "is_registered": False}]}}
                    raw_results = data.get("data", {}).get("results", [])

                    # Map results by phone variations for robust lookup
                    results_map: Dict[str, Dict[str, Any]] = {}
                    for item in raw_results:
                        phone = str(item.get("phone", "")).strip()
                        results_map[phone] = item
                        if phone.startswith("+"):
                            results_map[phone[1:]] = item
                        if phone.startswith("91") and len(phone) == 12:
                            results_map[phone[2:]] = item

                    result_list: List[AccountCheckData] = []
                    for m in mobile_numbers:
                        clean_m = str(m).strip()
                        item = results_map.get(clean_m)
                        if not item and clean_m.startswith("+"):
                            item = results_map.get(clean_m[1:])
                        if not item and len(clean_m) == 10:
                            item = results_map.get(f"91{clean_m}") or results_map.get(f"+91{clean_m}")

                        if item:
                            is_registered = bool(item.get("is_registered", False))
                            is_valid = bool(item.get("is_valid", True))
                            status_str = "Active" if is_registered else ("Not Registered" if is_valid else "Invalid Number")

                            result_list.append(AccountCheckData(
                                mobile_number=clean_m,
                                account_exists=is_registered,
                                user_id=item.get("user_id") or item.get("id"),
                                name=item.get("name"),
                                status=status_str,
                                # Extract any enriched profile fields the API may return in the future
                                email=item.get("email"),
                                dob=item.get("dob") or item.get("date_of_birth"),
                                alternate_phone=item.get("alternate_phone") or item.get("alternate_number"),
                                about=item.get("about") or item.get("bio"),
                                location=item.get("location") or item.get("city"),
                                user_type=item.get("user_type") or item.get("account_type"),
                                last_active=item.get("last_active") or item.get("last_seen"),
                                registered_on=item.get("registered_on") or item.get("created_at"),
                                verified=item.get("verified") or item.get("is_verified"),
                            ))
                        else:
                            result_list.append(AccountCheckData(
                                mobile_number=clean_m,
                                account_exists=False,
                                status="Not Registered"
                            ))

                    return result_list

            except Exception as e:
                logger.error(f"Error checking contacts (Attempt {attempt}): {e}")
                if attempt == self.max_retries:
                    return [
                        AccountCheckData(
                            mobile_number=m,
                            account_exists=False,
                            status="Failed",
                            error=str(e)
                        )
                        for m in mobile_numbers
                    ]
                await asyncio.sleep(1 * attempt)

        return [
            AccountCheckData(mobile_number=m, account_exists=False, status="Failed", error="Max retries reached")
            for m in mobile_numbers
        ]

def get_groupin_service() -> BaseGroupinService:
    if settings.USE_MOCK_GROUPIN:
        return MockGroupinService()
    return HttpGroupinService()
