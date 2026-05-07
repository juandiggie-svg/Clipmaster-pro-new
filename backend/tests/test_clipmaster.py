"""ClipMaster Pro backend API tests"""
import os
import base64
import io
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/') or \
           os.environ.get('EXPO_BACKEND_URL', '').rstrip('/')

# Fallback to known URL from frontend/.env
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')
                break


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def make_test_image_b64() -> str:
    """Create a small JPEG image with real content (gradient)"""
    img = Image.new('RGB', (96, 96))
    px = img.load()
    for y in range(96):
        for x in range(96):
            px[x, y] = ((x * 2) % 255, (y * 2) % 255, ((x + y) * 2) % 255)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=80)
    return base64.b64encode(buf.getvalue()).decode('ascii')


# ─────── Health ───────
class TestHealth:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert "ClipMaster" in r.json().get("message", "")


# ─────── Claude endpoint ───────
class TestClaude:
    def test_claude_text_only(self, api):
        r = api.post(f"{BASE_URL}/api/claude", json={
            "prompt": "Reply with exactly the words: hello world",
            "max_tokens": 50,
        }, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "text" in data
        assert isinstance(data["text"], str)
        assert len(data["text"].strip()) > 0

    def test_claude_with_image(self, api):
        b64 = make_test_image_b64()
        r = api.post(f"{BASE_URL}/api/claude", json={
            "prompt": "Describe what colors you see in this image in 1 sentence.",
            "max_tokens": 100,
            "images": [b64],
        }, timeout=90)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "text" in data
        assert len(data["text"].strip()) > 0

    def test_claude_missing_prompt(self, api):
        r = api.post(f"{BASE_URL}/api/claude", json={"max_tokens": 50})
        assert r.status_code == 422  # Pydantic validation error


# ─────── Posts CRUD ───────
class TestPosts:
    DEVICE_ID = "TEST_dev_clipmaster_xyz"
    OTHER_DEVICE = "TEST_dev_other_abc"

    @classmethod
    def teardown_class(cls):
        # Cleanup
        try:
            r = requests.get(f"{BASE_URL}/api/posts", params={"device_id": cls.DEVICE_ID})
            for p in r.json():
                requests.delete(f"{BASE_URL}/api/posts/{p['id']}", params={"device_id": cls.DEVICE_ID})
            r = requests.get(f"{BASE_URL}/api/posts", params={"device_id": cls.OTHER_DEVICE})
            for p in r.json():
                requests.delete(f"{BASE_URL}/api/posts/{p['id']}", params={"device_id": cls.OTHER_DEVICE})
        except Exception:
            pass

    def test_create_post(self, api):
        payload = {
            "device_id": self.DEVICE_ID,
            "platform": "instagram",
            "type": "Daily Post",
            "topic": "TEST_bald_fade",
            "likes": "150",
            "comments": "12",
            "reach": "2000",
        }
        r = api.post(f"{BASE_URL}/api/posts", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        # Must NOT contain mongo _id
        assert "_id" not in data
        assert data["topic"] == "TEST_bald_fade"
        assert data["likes"] == "150"
        assert data["device_id"] == self.DEVICE_ID
        assert "id" in data and data["id"]
        assert "date" in data
        assert "created_at" in data

    def test_list_posts_isolated_by_device(self, api):
        # Create a post for OTHER_DEVICE
        api.post(f"{BASE_URL}/api/posts", json={
            "device_id": self.OTHER_DEVICE,
            "platform": "tiktok", "type": "Reel",
            "topic": "TEST_other_device", "likes": "5",
        })
        # Create another post on main device
        api.post(f"{BASE_URL}/api/posts", json={
            "device_id": self.DEVICE_ID,
            "platform": "tiktok", "type": "Hook",
            "topic": "TEST_second", "likes": "300",
        })
        r = api.get(f"{BASE_URL}/api/posts", params={"device_id": self.DEVICE_ID})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        topics = [p["topic"] for p in data]
        # should contain main-device posts only
        assert "TEST_other_device" not in topics
        assert "TEST_second" in topics
        # No _id in any item
        for p in data:
            assert "_id" not in p

    def test_list_posts_sorted_desc(self, api):
        r = api.get(f"{BASE_URL}/api/posts", params={"device_id": self.DEVICE_ID})
        data = r.json()
        if len(data) >= 2:
            # most recently created first
            assert data[0]["created_at"] >= data[1]["created_at"]

    def test_delete_post(self, api):
        # Create then delete
        c = api.post(f"{BASE_URL}/api/posts", json={
            "device_id": self.DEVICE_ID,
            "platform": "instagram", "type": "Promo",
            "topic": "TEST_to_delete", "likes": "1",
        }).json()
        pid = c["id"]
        r = api.delete(f"{BASE_URL}/api/posts/{pid}", params={"device_id": self.DEVICE_ID})
        assert r.status_code == 200
        assert r.json().get("deleted") == 1
        # Verify gone
        r2 = api.get(f"{BASE_URL}/api/posts", params={"device_id": self.DEVICE_ID})
        assert pid not in [p["id"] for p in r2.json()]
