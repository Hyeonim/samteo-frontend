# Samteo Frontend

## Environment variables

Create or update `.env.local` before testing Kakao login.

```properties
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key
VITE_KAKAO_MAP_KEY=your_kakao_map_javascript_key
VITE_KAKAO_REDIRECT_URI=http://localhost:8080/login/oauth2/code/kakao
VITE_API_URL=http://localhost:8080
```

These values must match the backend and Kakao developer console settings:

- `VITE_KAKAO_REST_API_KEY` = backend `kakao.client.id`
- `VITE_KAKAO_MAP_KEY` = Kakao Maps JavaScript app key
- `VITE_KAKAO_REDIRECT_URI` = backend `kakao.redirect.uri`
- Kakao console Redirect URI = `http://localhost:8080/login/oauth2/code/kakao`
