# Samteo Frontend

## Environment variables

Create or update `.env.local` before testing Kakao login.

```properties
VITE_KAKAO_CLIENT_ID=your_kakao_rest_api_key
VITE_KAKAO_MAP_KEY=your_kakao_map_javascript_key
VITE_KAKAO_REDIRECT_URI=http://localhost:8080/login/oauth2/code/kakao
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google
VITE_NAVER_CLIENT_ID=your_naver_oauth_client_id
VITE_NAVER_REDIRECT_URI=http://localhost:8080/login/oauth2/code/naver
VITE_API_URL=http://localhost:8080
```

These values must match the backend and Kakao developer console settings:

- `VITE_KAKAO_CLIENT_ID` = backend `kakao.client.id`
- `VITE_KAKAO_MAP_KEY` = Kakao Maps JavaScript app key
- `VITE_KAKAO_REDIRECT_URI` = backend `kakao.redirect.uri`
- `VITE_GOOGLE_CLIENT_ID` = backend `google.client.id`
- `VITE_GOOGLE_REDIRECT_URI` = backend `google.redirect.uri`
- `VITE_NAVER_CLIENT_ID` = backend `naver.client.id`
- `VITE_NAVER_REDIRECT_URI` = backend `naver.redirect.uri`
- Kakao console Redirect URI = `http://localhost:8080/login/oauth2/code/kakao`
- Google console Redirect URI = `http://localhost:8080/login/oauth2/code/google`
- Naver console Callback URL = `http://localhost:8080/login/oauth2/code/naver`
