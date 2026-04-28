import { api } from '../api'
import useFetch from '../hooks/useFetch'

function HomePage() {
  const { data, loading, error } = useFetch(() => api.get('/api/health'))

  return (
    <div className="home-page">
      <h1>삼터(Samteo) 프로젝트 시작!</h1>
      <p>일터, 쉼터, 놀터가 하나로 연결되는 공간</p>

      <section style={{ marginTop: '2rem' }}>
        <h2>서버 상태</h2>
        {loading && <p>확인 중...</p>}
        {error && <p style={{ color: 'red' }}>오류: {error.message}</p>}
        {data && (
          <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '6px' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>
    </div>
  )
}

export default HomePage
