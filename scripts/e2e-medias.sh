#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
BASE="${E2E_BASE:-https://dashboard-biiip.vercel.app}"
JAR=/tmp/biiip-e2e-final.txt
rm -f "$JAR" /tmp/sid.txt /tmp/spath.txt

echo "== build =="
npm run build >/tmp/biiip-build.log 2>&1 || { tail -30 /tmp/biiip-build.log; exit 1; }

echo "== deploy =="
npx vercel --prod --yes >/tmp/biiip-deploy.log 2>&1 || { tail -40 /tmp/biiip-deploy.log; exit 1; }
rg -n "Aliased|Production|Error|deploy_failed" /tmp/biiip-deploy.log | tail -10

echo "== login =="
CSRF=$(curl -sS -c "$JAR" -b "$JAR" "$BASE/api/auth/csrf")
TOKEN=$(node -pe 'JSON.parse(process.argv[1]).csrfToken' "$CSRF")
curl -sS -c "$JAR" -b "$JAR" -o /dev/null \
  -X POST "$BASE/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$TOKEN" \
  --data-urlencode "password=1076" \
  --data-urlencode "callbackUrl=$BASE/medias" \
  --data-urlencode "json=true"
ROLE=$(curl -sS -b "$JAR" "$BASE/api/auth/session" | node -pe 'JSON.parse(require("fs").readFileSync(0,"utf8")).user?.role||"none"')
echo "role=$ROLE"
test "$ROLE" != "none"

echo "== upload =="
UPLOAD=$(curl -sS -b "$JAR" -F "file=@public/biiip-fond.jpg;type=image/jpeg" "$BASE/api/uploads")
URL=$(node -pe 'JSON.parse(process.argv[1]).url' "$UPLOAD")
echo "url_prefix=${URL:0:32}"

echo "== generate (optional, 12s max) =="
GEN_BODY='{"notes":"Plateau samedi au Biiip, salle pleine, Leo Mirage, ambiance cave voutee","has_photo":true}'
set +e
GEN=$(curl -sS -b "$JAR" -m 12 -w "\nHTTP:%{http_code}" \
  -X POST "$BASE/api/site-stories/generate" \
  -H "Content-Type: application/json" \
  -d "$GEN_BODY")
GEN_EC=$?
set -e
echo "gen_ec=$GEN_EC gen_tail=$(echo "$GEN" | tail -3 | tr '\n' ' ')"

H1=""
BODY=""
FAQS="[]"
GB="manual"
if echo "$GEN" | rg -q '"draft"'; then
  H1=$(echo "$GEN" | node -pe 'const t=require("fs").readFileSync(0,"utf8").split("\n").filter(l=>!l.startsWith("HTTP:")).join("\n"); const j=JSON.parse(t); j.draft?.h1||""')
  BODY=$(echo "$GEN" | node -pe 'const t=require("fs").readFileSync(0,"utf8").split("\n").filter(l=>!l.startsWith("HTTP:")).join("\n"); const j=JSON.parse(t); j.draft?.body_text||""')
  GB=$(echo "$GEN" | node -pe 'const t=require("fs").readFileSync(0,"utf8").split("\n").filter(l=>!l.startsWith("HTTP:")).join("\n"); const j=JSON.parse(t); j.draft?.generated_by||"manual"')
  echo "gen_ok h1_len=${#H1} body_len=${#BODY} by=$GB"
fi

echo "== preview =="
PAYLOAD=$(node -e '
const url=process.argv[1], h1=process.argv[2], body=process.argv[3], gb=process.argv[4];
const o={
  notes:"Plateau samedi au Biiip, salle pleine, Leo Mirage, ambiance cave voutee",
  photo_urls:[url],
  video_url:"",
  show_id:null,
  h1:h1||undefined,
  body_text:body||undefined,
  generated_by:gb
};
console.log(JSON.stringify(o));
' "$URL" "$H1" "$BODY" "$GB")

PREVIEW=$(curl -sS -b "$JAR" -m 15 -w "\nHTTP:%{http_code}\nTIME:%{time_total}" \
  -X POST "$BASE/api/site-stories/preview" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "$PREVIEW" | node -e '
const t=require("fs").readFileSync(0,"utf8");
const lines=t.trim().split("\n");
const meta=lines.filter(l=>/^HTTP:|^TIME:/.test(l));
const raw=lines.filter(l=>!/^HTTP:|^TIME:/.test(l)).join("\n");
if(raw.includes("FUNCTION_INVOCATION_TIMEOUT")) { console.log("TIMEOUT", meta.join(" ")); process.exit(2); }
const j=JSON.parse(raw);
if(!j.site_story) { console.log("FAIL", raw.slice(0,300)); process.exit(1); }
console.log(meta.join(" "), "h1=", j.site_story.h1.slice(0,70));
require("fs").writeFileSync("/tmp/sid.txt", j.site_story._id);
require("fs").writeFileSync("/tmp/spath.txt", j.public_path);
'

SID=$(cat /tmp/sid.txt)
SPATH=$(cat /tmp/spath.txt)

echo "== publish =="
PUB=$(curl -sS -b "$JAR" -X POST "$BASE/api/site-stories/$SID/publish")
echo "$PUB" | node -pe 'const j=JSON.parse(require("fs").readFileSync(0,"utf8")); j.message||j.error'

echo "== page =="
CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$BASE$SPATH")
echo "page_status=$CODE"
test "$CODE" = "200"

echo "E2E_OK $BASE$SPATH"
