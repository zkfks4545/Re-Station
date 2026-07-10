import type { BgmAudioChannel } from '@/hooks/useAudioManager.js'

interface BarMusicTabProps {
  bgm: BgmAudioChannel
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function BarMusicTab({ bgm }: BarMusicTabProps) {
  const volumePercent = Math.round(bgm.volume * 100)
  const showTime = bgm.isReady && bgm.selectedPresetId

  return (
    <div className="music-panel">
      <div className="music-now">
        <span className="music-now__label">NOW</span>
        <strong className="music-now__title">
          {bgm.selectedPreset?.title ?? '선택된 BGM 없음'}
        </strong>
        <span className="music-now__state">
          {bgm.autoplayBlocked ? '자동재생 차단' : bgm.isPlaying ? '재생 중' : bgm.isReady ? '일시정지' : '대기 중'}
        </span>
        {showTime && (
          <div className="music-progress">
            <div
              className="music-progress__fill"
              style={{ width: `${bgm.duration > 0 ? (bgm.currentTime / bgm.duration) * 100 : 0}%` }}
            />
            <span className="music-progress__label">
              {formatTime(bgm.currentTime)} / {formatTime(bgm.duration)}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="music-control-btn"
        onClick={bgm.togglePlayPause}
      >
        {bgm.isPlaying ? '[ 일시정지 ]' : '[ 재생 ]'}
      </button>

      <label className="music-slider">
        <span>BGM 볼륨</span>
        <input
          type="range"
          min="0"
          max="100"
          value={volumePercent}
          onChange={(event) => bgm.setVolume(Number(event.target.value) / 100)}
        />
        <span>{volumePercent}%</span>
      </label>

      <button
        type="button"
        className={`music-control-btn ${bgm.muted ? 'music-control-btn--active' : ''}`}
        onClick={bgm.toggleMuted}
      >
        {bgm.muted ? '[ 음소거 해제 ]' : '[ 음소거 ]'}
      </button>

      <ul className="music-track-list">
        {bgm.presets.map((preset) => (
          <li key={preset.id}>
            <button
              type="button"
              className={`music-track ${bgm.selectedPresetId === preset.id ? 'music-track--active' : ''}`}
              onClick={() => bgm.togglePreset(preset.id)}
            >
              <span className="music-track__title">{preset.title}</span>
              <span className="music-track__sub">{preset.subtitle}</span>
              <span className="music-track__state">
                {bgm.selectedPresetId === preset.id ? (bgm.isPlaying ? '▶ ON' : 'Ⅱ') : '○'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {bgm.error && <p className="sidebar-error">{bgm.error}</p>}
    </div>
  )
}
