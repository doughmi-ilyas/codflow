#!/usr/bin/env bash
# End-to-end check through the web app: login (httpOnly cookie), create an order, see it listed in FR and AR.
# Expects the API on :3001 and the web app on :3000, with `npm run seed` already done.
set -euo pipefail
WEB=${WEB:-http://localhost:3000}
JAR=$(mktemp)

code=$(curl -s -o /dev/null -w '%{http_code}' "$WEB/fr/orders")
[ "$code" = "307" ] || { echo "expected a redirect to login without a session, got $code"; exit 1; }

bad=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$WEB/api/login" -H 'content-type: application/json' \
  -d '{"tenant":"atlas-shop","email":"owner@atlas-shop.test","password":"wrong"}')
[ "$bad" = "401" ] || { echo "wrong password should give 401, got $bad"; exit 1; }

curl -sf -c "$JAR" -X POST "$WEB/api/login" -H 'content-type: application/json' \
  -d '{"tenant":"atlas-shop","email":"owner@atlas-shop.test","password":"demo-password"}' > /dev/null
grep -q HttpOnly "$JAR" || { echo "session cookie is not httpOnly"; exit 1; }

ref="SMOKE-$RANDOM"
curl -sf -b "$JAR" -X POST "$WEB/api/proxy" -H 'content-type: application/json' \
  -d "{\"path\":\"/orders\",\"method\":\"POST\",\"body\":{\"reference\":\"$ref\",\"customerName\":\"Fatima Zahra\",\"phone\":\"0612345678\",\"city\":\"Casablanca\",\"address\":\"12 rue des Orangers\",\"totalCents\":24900}}" > /dev/null

blocked=$(curl -s -o /dev/null -w '%{http_code}' -b "$JAR" -X POST "$WEB/api/proxy" -H 'content-type: application/json' \
  -d '{"path":"/permissions/agent","method":"PUT","body":{}}')
[ "$blocked" = "400" ] || { echo "proxy must refuse other paths, got $blocked"; exit 1; }

curl -sf -b "$JAR" "$WEB/fr/orders" | grep -q "$ref" || { echo "order not listed in /fr/orders"; exit 1; }
curl -sf -b "$JAR" "$WEB/ar/orders" | grep -q 'dir="rtl"' || { echo "Arabic page is not right-to-left"; exit 1; }
echo "smoke test passed ($ref)"
