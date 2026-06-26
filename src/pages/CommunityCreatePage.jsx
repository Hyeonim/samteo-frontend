import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './ExplorePages.css'

const TEXT = {
  title: '\uC0C8 \uAC8C\uC2DC\uAE00 \uC791\uC131',
  imageAdd: '\uC774\uBBF8\uC9C0 \uCD94\uAC00',
  imageMore: '\uB354 \uCD94\uAC00',
  imageRemove: '\uC774\uBBF8\uC9C0 \uC0AD\uC81C',
  prevImage: '\uC774\uC804 \uC774\uBBF8\uC9C0',
  nextImage: '\uB2E4\uC74C \uC774\uBBF8\uC9C0',
  imageHelp: '\uC5EC\uB7EC \uC7A5\uC744 \uD55C \uBC88\uC5D0 \uC62C\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4',
  textarea: '\uC624\uB298\uC758 \uC774\uC57C\uAE30\uB97C \uC801\uC5B4\uBCF4\uC138\uC694. #\uD0DC\uADF8\uB294 \uB744\uC5B4\uC4F0\uAE30\uB85C \uAD6C\uBD84\uD574\uC11C \uC785\uB825\uD574\uC8FC\uC138\uC694.',
  submit: '\uAC8C\uC2DC\uD558\uAE30',
  preview: '\uBBF8\uB9AC\uBCF4\uAE30',
  previewTitle: '\uAC8C\uC2DC\uAE00 \uBBF8\uB9AC\uBCF4\uAE30',
  previewEmpty: '\uC791\uC131\uD55C \uB0B4\uC6A9\uC774 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4.',
  close: '\uB2EB\uAE30',
  cancel: '\uCDE8\uC18C',
  required: '\uC774\uBBF8\uC9C0\uB098 \uAE00 \uC911 \uD558\uB098\uB294 \uC785\uB825\uD574\uC57C \uAC8C\uC2DC\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
  count: '\uC7A5',
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function renderComposerPreview(text) {
  if (!text) return null

  return text.split(/(\s+)/).map((part, index) => {
    if (part.startsWith('#') && part.length > 1) {
      return <span className="community-inline-tag" key={`${part}-${index}`}>{part}</span>
    }
    return part
  })
}

export default function CommunityCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const authorName = user?.name || 'samteo_user'
  const [caption, setCaption] = useState('')
  const [images, setImages] = useState([])
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [error, setError] = useState('')

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const previews = await Promise.all(files.map(readFileAsDataUrl))
    setImages((prev) => {
      const next = [...prev, ...previews]
      setActiveImageIndex(prev.length)
      return next
    })
    setError('')
    event.target.value = ''
  }

  const removeActiveImage = () => {
    setImages((prev) => {
      const next = prev.filter((_, index) => index !== activeImageIndex)
      setActiveImageIndex((current) => Math.max(0, Math.min(current, next.length - 1)))
      return next
    })
  }

  const goPrevImage = () => {
    setActiveImageIndex((index) => Math.max(0, index - 1))
  }

  const goNextImage = () => {
    setActiveImageIndex((index) => Math.min(images.length - 1, index + 1))
  }

  const submit = (event) => {
    event.preventDefault()

    if (!caption.trim() && images.length === 0) {
      setError(TEXT.required)
      return
    }

    navigate('/community', {
      state: {
        newPost: {
          id: Date.now(),
          author: authorName,
          elapsed: '\uBC29\uAE08',
          caption: caption.trim(),
          images,
          imageCountText: images.length > 0 ? `${images.length}${TEXT.count}` : '\uC774\uBBF8\uC9C0 \uC5C6\uC74C',
          likes: 0,
          comments: 0,
          saves: 0,
        },
      },
    })
  }

  return (
    <main className="community-page community-create-page">
      <section className="community-create-shell">
        <header className="community-create-head">
          <h1>{TEXT.title}</h1>
          <button type="button" onClick={() => navigate('/community')}>{TEXT.cancel}</button>
        </header>

        <form className="community-create-form" onSubmit={submit}>
          <div className="community-create-image-panel">
            <label className={`community-create-upload${images.length > 0 ? ' has-images' : ''}`}>
              <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              {images.length > 0 ? (
                <>
                  <img src={images[activeImageIndex]} alt="" />
                  <button
                    className="community-image-remove"
                    type="button"
                    onClick={removeActiveImage}
                    aria-label={TEXT.imageRemove}
                  >
                    x
                  </button>
                  {images.length > 1 && (
                    <button
                      className="community-image-nav prev"
                      type="button"
                      onClick={goPrevImage}
                      aria-label={TEXT.prevImage}
                      disabled={activeImageIndex === 0}
                    >
                      &lt;
                    </button>
                  )}
                  {activeImageIndex < images.length - 1 ? (
                    <button
                      className="community-image-nav next"
                      type="button"
                      onClick={goNextImage}
                      aria-label={TEXT.nextImage}
                    >
                      &gt;
                    </button>
                  ) : (
                    <span className="community-image-nav next add">
                      <input type="file" accept="image/*" multiple onChange={handleImageChange} />
                      +
                    </span>
                  )}
                </>
              ) : (
                <div>
                  <strong>{TEXT.imageAdd}</strong>
                  <span>{TEXT.imageHelp}</span>
                </div>
              )}
            </label>

            {images.length > 0 && (
              <div className="community-image-progress">
                <div className="community-image-dots" aria-label="uploaded images">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      className={activeImageIndex === index ? 'active' : ''}
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={`${index + 1}`}
                      key={`${image.slice(0, 24)}-${index}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea
            value={caption}
            onChange={(event) => {
              setCaption(event.target.value)
              setError('')
            }}
            placeholder={TEXT.textarea}
            maxLength={600}
          />

          {error && <p className="community-submit-error">{error}</p>}

          <div className="community-create-actions">
            <span>{caption.length}/600</span>
            <div>
              <button className="secondary" type="button" onClick={() => setIsPreviewOpen(true)}>{TEXT.preview}</button>
              <button type="submit">{TEXT.submit}</button>
            </div>
          </div>
        </form>
      </section>

      {isPreviewOpen && (
        <div className="community-preview-backdrop" role="presentation">
          <section className="community-preview-modal" role="dialog" aria-modal="true" aria-label={TEXT.previewTitle}>
            <header className="community-preview-head">
              <h2>{TEXT.previewTitle}</h2>
              <button type="button" onClick={() => setIsPreviewOpen(false)}>{TEXT.close}</button>
            </header>
            <article className="community-feed-card community-preview-card">
              <header className="community-card-head">
                <div className="community-avatar">{authorName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <div className="community-author-row">
                    <strong>{authorName}</strong>
                    <span>{'\uBC29\uAE08'}</span>
                  </div>
                  <p>{images.length > 0 ? `${images.length}${TEXT.count}` : '\uC774\uBBF8\uC9C0 \uC5C6\uC74C'}</p>
                </div>
                <button type="button" aria-label="menu">...</button>
              </header>

              {images.length > 0 && (
                <div
                  className="community-photo has-image"
                  style={{ backgroundImage: `url(${images[0]})` }}
                >
                  {images.length > 1 && <span>{images.length}</span>}
                </div>
              )}

              <div className="community-card-copy">
                <p>
                  <strong>{authorName}</strong>{' '}
                  {caption.trim() ? renderComposerPreview(caption) : TEXT.previewEmpty}
                </p>
              </div>
            </article>
          </section>
        </div>
      )}
    </main>
  )
}
