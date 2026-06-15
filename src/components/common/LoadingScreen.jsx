import './LoadingScreen.css'

function LoadingScreen({
  message = '잠시만 기다려 주세요',
  description = '필요한 정보를 불러오고 있습니다.',
  variant = 'inline',
  state = 'open',
}) {
  return (
    <div className={`loading-screen loading-screen--${variant} loading-screen--${state}`} role="status" aria-live="polite">
      <div className="loading-screen__mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div>
        <strong>{message}</strong>
        {description && <p>{description}</p>}
      </div>
    </div>
  )
}

export default LoadingScreen
